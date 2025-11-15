from django.core.exceptions import ObjectDoesNotExist
from django.db.models.aggregates import Count
from django.shortcuts import get_object_or_404
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, DestroyModelMixin, UpdateModelMixin
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser, DjangoModelPermissionsOrAnonReadOnly
from rest_framework.viewsets import ModelViewSet, GenericViewSet

import stripe
from django.conf import settings
from rest_framework.decorators import api_view, action, permission_classes

from store.models import Product, Collection, OrderItem, Review, Cart, CartItem, Customer, Order, ProductImage, Address
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend

from .filters import ProductFilter
from .pagination import DefaultPagination
from .permissions import IsAdminOrReadOnly, FullDjangoModelPermissions, ViewCustomerHistoryPermissions
from .serializers import ProductSerializer, CollectionSerializer, ReviewSerializer, CartSerializer, CartItemSerializer, \
    AddCartItemSearializer, UpdateCartItemSerializer, CustomerSerializer, OrderSerializer, CreateOrderSerializer, \
    UpdateOrderSerializer, ProductImageSerializer, AddressSerializer, GuestOrderSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, action
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter

# ViewSet can create, update, delete ...
# If u dont want do this operations ^
# Use ReadOnlyModelViewSet - can't update, delete ...
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.prefetch_related('images').all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    pagination_class = DefaultPagination
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['title', 'description']
    ordering_fields = ['unit_price', 'last_update']

    def get_serializer_context(self):
        return {'request': self.request}
    # Delete using def destroy
    # We dont need Delete in 'products/'
    # Overwrite func
    def destroy(self, request, *args, **kwargs):
        if OrderItem.objects.filter(product_id = kwargs['pk']).count() > 0:
            return Response({'error':'Product assosiated with oredr item'})
        return super().destroy(request, *args, **kwargs)

class ProductImageViewSet(ModelViewSet):
    serializer_class = ProductImageSerializer

    def get_serializer_context(self):
        return {'product_id': self.kwargs['product_pk']}


    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_pk'])

class CollectionViewSet(ModelViewSet):
    queryset = Collection.objects.annotate(
        products_count=Count('products')).all()
    serializer_class = CollectionSerializer
    permission_classes = [IsAdminOrReadOnly]

    # Delete using def destroy
    # We dont need Delete in 'collections/'
    # Overwrite func
    def destroy(self, request, *args, **kwargs):
        if OrderItem.objects.filter(collection_id = kwargs['pk']).count() > 0:
            return Response({'error':'Collection assosiated with oredr item'})
        return super().destroy(request, *args, **kwargs)


class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(product_id = self.kwargs['product_pk'])

    def get_serializer_context(self):
        return {'product_id': self.kwargs['product_pk']}

# custom VieSet bcs we dont need everything
class CartViewSet(CreateModelMixin,
                  RetrieveModelMixin,
                  DestroyModelMixin,
                  GenericViewSet):
    queryset = Cart.objects.prefetch_related('items__product').all()
    serializer_class = CartSerializer

class CartItemViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AddCartItemSearializer
        elif self.request.method == 'PATCH':
            return UpdateCartItemSerializer
        return CartItemSerializer

    def get_serializer_context(self):
        return {'cart_id': self.kwargs['cart_pk']}

    def get_queryset(self):
        return (CartItem.objects\
                .filter(cart_id = self.kwargs['cart_pk']))\
                .select_related('product')

class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, permission_classes=[ViewCustomerHistoryPermissions])
    def history(self, request, pk):
        return Response('ok')

    @action(detail=False, methods=['GET', 'PUT'], permission_classes=[IsAuthenticated])
    def me(self, request):
        customer, created = Customer.objects.get_or_create(user=request.user)

        # 1. Spróbuj pobrać koszyk, który jest już przypisany do konta klienta
        try:
            cart = customer.cart
            print(f"Użytkownik {customer.user.username} ma już stały koszyk: {cart.id}")
            # Jeśli koszyk istnieje, reszta logiki jest niepotrzebna
        except ObjectDoesNotExist:
            # 2. Jeśli klient nie ma stałego koszyka, sprawdź, czy istnieje tymczasowy koszyk w sesji
            cart_id_from_session = request.session.get('cart_id')
            cart = None

            if cart_id_from_session:
                try:
                    # Spróbuj pobrać anonimowy koszyk
                    temp_cart = Cart.objects.get(pk=cart_id_from_session, customer__isnull=True)

                    # 3. Przypisz anonimowy koszyk do klienta
                    temp_cart.customer = customer
                    temp_cart.save()
                    cart = temp_cart
                    print(f"Przypisano anonimowy koszyk {cart.id} do użytkownika {customer.user.username}")

                except (Cart.DoesNotExist, ValueError):
                    # 4. Jeśli anonimowy koszyk nie istnieje, stwórz nowy
                    cart = Cart.objects.create(customer=customer)
                    print(f"Anonimowy koszyk {cart_id_from_session} nie istnieje. Stworzono nowy {cart.id}")
            else:
                # 5. Jeśli w sesji nie ma koszyka, stwórz nowy
                cart = Cart.objects.create(customer=customer)
                print(f"Brak koszyka w sesji. Stworzono nowy dla {customer.user.username} z ID {cart.id}")

        # 6. Kontynuuj obsługę żądania GET/PUT z przypisanym koszykiem
        if request.method == 'GET':
            # Przygotuj dane do serializacji
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = CustomerSerializer(customer, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
            return Response(serializer.data)

    @action(detail=False, methods=['PUT'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        user = request.user
        new_password = request.data.get('password')

        if not new_password:
            return Response({'error': 'Password is required'}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully'})



class OrderViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(
            data=request.data,
            context={'user_id': self.request.user.id})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateOrderSerializer
        elif self.request.method == 'PATCH':
            return UpdateOrderSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_staff:
            return Order.objects.all()

        customer_id = Customer.objects.only('id').get(user_id=user.id)
        
        # For list view (/orders), show only completed orders
        # For detail view (/orders/{id}/), allow access to all their orders (including pending)
        if self.action == 'list':
            return Order.objects.filter(customer_id=customer_id, payment_status=Order.PAYMENT_STATUS_COMPLETE)
        else:
            # Allow access to all their orders for retrieve/update/delete operations
            return Order.objects.filter(customer_id=customer_id)

class AddressViewSet(ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Address.objects.all()
        customer = Customer.objects.get(user_id=user.id)
        return Address.objects.filter(customer=customer)

    def perform_create(self, serializer):
        customer = Customer.objects.get(user_id=self.request.user.id)
        serializer.save(customer=customer)

    def create(self, request, *args, **kwargs):
        try:
            print(f"Creating address with data: {request.data}")
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Address creation error: {e}")
            return Response({'error': str(e)}, status=400)

    def update(self, request, *args, **kwargs):
        try:
            print(f"Updating address with data: {request.data}")
            return super().update(request, *args, **kwargs)
        except Exception as e:
            print(f"Address update error: {e}")
            return Response({'error': str(e)}, status=400)
'''
@api_view(['GET', 'PUT', 'DELETE'])
def product_detail(request, pk):
    # Create Objcect IF DOESNOTEXIST Return RESPONSE('Not Found')
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'GET':
        serializer = ProductSerializer(product,context={'request': request}) # Converting DJ object to JSON Object
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    elif request.method == 'DELETE':
        if product.orderitems.count() > 0:
            return Response({'error': 'Product can\'t be deleted because product is assosiated with OrderItem'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def collection_list(request):
    if request.method == 'GET':
        collections = Collection.objects.annotate(products_count=Count('product'))
        serializer = CollectionSerializer(
            collections,  # 👈 to tutaj musi być!
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = CollectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
def collection_detail(request, pk):
    collection = get_object_or_404(Collection.objects.annotate(products_count=Count('product'), pk=pk))
    if request.method == 'GET':
        serializer = CollectionSerializer(collection)
        return Response(serializer.data)
    if request.method == 'PUT':
        serializer = CollectionSerializer(collection, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    if request.method == 'DELETE':
        if collection.products.count() > 0:
            return Response
        collection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

'''


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """
    Create a Stripe Checkout session for payment
    """
    try:
        # Set Stripe API key
        stripe.api_key = settings.STRIPE_SECRET_KEY
        print(f"Using Stripe key: {settings.STRIPE_SECRET_KEY[:7]}...")

        data = request.data
        print(f"Received data: {data}")

        order_id = data.get('orderId')
        address_id = data.get('addressId')

        print(f"Order ID: {order_id}, Address ID: {address_id}")

        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not address_id:
            return Response({'error': 'Address ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get order and address details
        try:
            order = get_object_or_404(Order, id=order_id)
            print(f"Found order: {order.id}")
        except Exception as e:
            print(f"Order not found: {e}")
            return Response({'error': f'Order not found: {str(e)}'}, status=status.HTTP_404_NOT_FOUND)

        try:
            address = get_object_or_404(Address, id=address_id)
            print(f"Found address: {address.id}")
        except Exception as e:
            print(f"Address not found: {e}")
            return Response({'error': f'Address not found: {str(e)}'}, status=status.HTTP_404_NOT_FOUND)

        # Create line items for Stripe using order items
        line_items = []
        print(f"Order items count: {order.items.count()}")

        for item in order.items.all():
            print(f"Processing item: {item.product.title}, price: {item.unit_price}, qty: {item.quantity}")
            line_items.append({
                'price_data': {
                    'currency': 'pln',
                    'product_data': {
                        'name': item.product.title,
                        'description': item.product.description or '',
                    },
                    'unit_amount': int(item.unit_price * 100),  # Convert to cents
                },
                'quantity': item.quantity,
            })

        # Calculate delivery cost based on order total
        delivery_cost = order.calculate_delivery_cost()
        
        # Add delivery fee only if not free
        if delivery_cost > 0:
            line_items.append({
                'price_data': {
                    'currency': 'pln',
                    'product_data': {
                        'name': 'Dostawa',
                        'description': f'Dostawa na adres: {address.street} {address.house_number}, {address.city}',
                    },
                    'unit_amount': int(delivery_cost * 100),  # Convert to cents
                },
                'quantity': 1,
            })
        else:
            # Add free delivery info
            line_items.append({
                'price_data': {
                    'currency': 'pln',
                    'product_data': {
                        'name': 'Dostawa',
                        'description': f'Darmowa dostawa na adres: {address.street} {address.house_number}, {address.city}',
                    },
                    'unit_amount': 0,  # Free delivery
                },
                'quantity': 1,
            })

        # Update order total_price before creating Stripe session
        order.total_price = order.calculate_total()
        order.save()

        print(f"Creating Stripe session with {len(line_items)} line items")
        print(f"Order total: {order.total_price} PLN (delivery: {delivery_cost} PLN)")

        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=f"{settings.FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}",
            cancel_url=f"{settings.FRONTEND_URL}/checkout/payment",
            metadata={
                'order_id': str(order_id),
                'address_id': str(address_id),
            }
        )

        print(f"Stripe session created: {session.id}")

        return Response({
            'url': session.url,
            'sessionId': session.id
        })

    except Exception as e:
        print(f"Error in create_checkout_session: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request):
    """
    Cancel pending order and keep cart items
    """
    try:
        order_id = request.data.get('orderId')
        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        order = get_object_or_404(Order, id=order_id)
        
        # Only allow canceling pending orders
        if order.payment_status != Order.PAYMENT_STATUS_PENDING:
            return Response({'error': 'Cannot cancel completed order'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete the pending order
        order.delete()
        
        return Response({'message': 'Order cancelled successfully'})
        
    except Exception as e:
        print(f"Error in cancel_order: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_success(request):
    """
    Handle successful payment - complete order and clear cart
    """
    try:
        session_id = request.GET.get('session_id')
        order_id = request.GET.get('order_id')
        
        print(f"Payment success called with session_id: {session_id}, order_id: {order_id}")
        
        if not session_id or not order_id:
            return Response({'error': 'Missing session_id or order_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get order first to check ownership
        order = get_object_or_404(Order, id=order_id)
        
        # Check if user owns this order
        customer = Customer.objects.get(user_id=request.user.id)
        if order.customer.id != customer.id:
            return Response({'error': 'Unauthorized access to order'}, status=status.HTTP_403_FORBIDDEN)
        
        print(f'Found order {order_id}, current status: {order.payment_status}')
        
        # If already completed, just return success
        if order.payment_status == Order.PAYMENT_STATUS_COMPLETE:
            print(f'Order {order_id} already completed')
            return Response({
                'message': 'Payment already completed',
                'order_id': order_id,
                'session_id': session_id
            })
        
        # Verify with Stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        print(f"Using Stripe key for verification: {settings.STRIPE_SECRET_KEY[:12]}...")
        
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            print(f"Retrieved session: {session.id}, payment_status: {session.payment_status}")
        except Exception as stripe_error:
            print(f"Error retrieving Stripe session: {stripe_error}")
            # If Stripe verification fails, still try to complete the order if it's pending
            # This is a fallback for when webhook might have already processed it
            if order.payment_status == Order.PAYMENT_STATUS_PENDING:
                print("Stripe verification failed, but order is pending. Completing order anyway.")
                order.payment_status = Order.PAYMENT_STATUS_COMPLETE
                order.save()
                print(f'Order {order_id} status updated to: {order.payment_status}')
                
                # Clear cart
                try:
                    if hasattr(order.customer, 'cart') and order.customer.cart:
                        cart_id = order.customer.cart.id
                        order.customer.cart.delete()
                        print(f'Cart {cart_id} deleted for customer {order.customer.id}')
                except Exception as cart_error:
                    print(f'Error deleting cart: {cart_error}')
                
                return Response({
                    'message': 'Payment completed (fallback)',
                    'order_id': order_id,
                    'session_id': session_id
                })
            
            return Response({'error': f'Stripe error: {str(stripe_error)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if payment was successful
        if session.payment_status == 'paid' or session.status == 'complete':
            print(f'Payment verified for order {order_id}')
            
            # Update order status to COMPLETE
            order.payment_status = Order.PAYMENT_STATUS_COMPLETE
            order.save()
            print(f'Order {order_id} status updated to: {order.payment_status}')
            
            # Clear the cart now that payment is successful
            try:
                if hasattr(order.customer, 'cart') and order.customer.cart:
                    cart_id = order.customer.cart.id
                    order.customer.cart.delete()
                    print(f'Cart {cart_id} deleted for customer {order.customer.id}')
                else:
                    print(f'No cart found for customer {order.customer.id}')
            except Exception as cart_error:
                print(f'Error deleting cart: {cart_error}')
            
            return Response({
                'message': 'Payment successful',
                'order_id': order_id,
                'session_id': session_id
            })
        else:
            print(f'Payment not completed. Session status: {session.status}, payment_status: {session.payment_status}')
            return Response({'error': 'Payment not completed'}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"Error in payment_success: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_order(request):
    """
    Manual order completion (backup when payment_success fails)
    """
    try:
        order_id = request.data.get('orderId')
        
        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        order = get_object_or_404(Order, id=order_id)
        
        # Check if user owns this order
        customer = Customer.objects.get(user_id=request.user.id)
        if order.customer.id != customer.id:
            return Response({'error': 'Unauthorized access to order'}, status=status.HTTP_403_FORBIDDEN)
        
        print(f'Manual completion for order {order_id}, current status: {order.payment_status}')
        
        # Only complete pending orders
        if order.payment_status != Order.PAYMENT_STATUS_PENDING:
            return Response({'error': 'Order is not pending'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Complete the order
        order.payment_status = Order.PAYMENT_STATUS_COMPLETE
        order.save()
        print(f'Order {order_id} manually completed')
        
        # Clear cart
        try:
            if hasattr(order.customer, 'cart') and order.customer.cart:
                cart_id = order.customer.cart.id
                order.customer.cart.delete()
                print(f'Cart {cart_id} deleted for customer {order.customer.id}')
        except Exception as cart_error:
            print(f'Error deleting cart: {cart_error}')
        
        return Response({
            'message': 'Order completed successfully',
            'order_id': order_id
        })
        
    except Exception as e:
        print(f"Error in complete_order: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ============ GUEST CHECKOUT ENDPOINTS ============

@api_view(['POST'])
@permission_classes([AllowAny])
def create_guest_order(request):
    """
    Create order for guest user (no authentication required)
    """
    try:
        print(f"Creating guest order with data: {request.data}")
        
        serializer = GuestOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Return basic order info
        return Response({
            'id': order.id,
            'total_price': order.total_price,
            'guest_email': order.guest_email,
            'guest_first_name': order.guest_first_name,
            'guest_last_name': order.guest_last_name
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Error in create_guest_order: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def create_guest_checkout_session(request):
    """
    Create Stripe checkout session for guest order
    """
    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        print(f"Creating guest checkout session with data: {request.data}")

        order_id = request.data.get('orderId')
        
        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get order
        order = get_object_or_404(Order, id=order_id)
        
        # Verify this is a guest order
        if order.customer is not None:
            return Response({'error': 'This is not a guest order'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Found guest order: {order.id} for {order.guest_email}")

        # Get the shipping address
        try:
            address = order.shipping_address.first()  # Get the related address
            if not address:
                return Response({'error': 'No shipping address found'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Address retrieval error: {e}")
            return Response({'error': 'Address not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Create line items for Stripe
        line_items = []
        for item in order.items.all():
            line_items.append({
                'price_data': {
                    'currency': 'pln',
                    'product_data': {
                        'name': item.product.title,
                        'description': item.product.description or '',
                    },
                    'unit_amount': int(item.unit_price * 100),
                },
                'quantity': item.quantity,
            })

        # Add delivery cost
        delivery_cost = order.calculate_delivery_cost()
        if delivery_cost > 0:
            line_items.append({
                'price_data': {
                    'currency': 'pln',
                    'product_data': {
                        'name': 'Dostawa',
                        'description': f'Dostawa na adres: {address.street} {address.house_number}, {address.city}',
                    },
                    'unit_amount': int(delivery_cost * 100),
                },
                'quantity': 1,
            })

        # Create Stripe session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=f"{settings.FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}&guest=true",
            cancel_url=f"{settings.FRONTEND_URL}/checkout/payment",
            customer_email=order.guest_email,  # Pre-fill email for guest
            metadata={
                'order_id': str(order_id),
                'guest_order': 'true',
            }
        )

        print(f"Guest Stripe session created: {session.id}")

        return Response({
            'url': session.url,
            'sessionId': session.id
        })

    except Exception as e:
        print(f"Error in create_guest_checkout_session: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def guest_payment_success(request):
    """
    Handle successful payment for guest orders
    """
    try:
        session_id = request.GET.get('session_id')
        order_id = request.GET.get('order_id')
        
        print(f"Guest payment success called with session_id: {session_id}, order_id: {order_id}")
        
        if not session_id or not order_id:
            return Response({'error': 'Missing session_id or order_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get order
        order = get_object_or_404(Order, id=order_id)
        
        # Verify this is a guest order
        if order.customer is not None:
            return Response({'error': 'This is not a guest order'}, status=status.HTTP_403_FORBIDDEN)
        
        print(f'Found guest order {order_id}, current status: {order.payment_status}')
        
        # If already completed, just return success
        if order.payment_status == Order.PAYMENT_STATUS_COMPLETE:
            print(f'Guest order {order_id} already completed')
            return Response({
                'message': 'Payment already completed',
                'order_id': order_id,
                'session_id': session_id,
                'guest_email': order.guest_email
            })
        
        # Verify with Stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            print(f"Retrieved guest session: {session.id}, payment_status: {session.payment_status}")
        except Exception as stripe_error:
            print(f"Error retrieving Stripe session for guest: {stripe_error}")
            # Fallback for guest orders
            if order.payment_status == Order.PAYMENT_STATUS_PENDING:
                print("Stripe verification failed for guest, but order is pending. Completing order anyway.")
                order.payment_status = Order.PAYMENT_STATUS_COMPLETE
                order.save()
                print(f'Guest order {order_id} status updated to: {order.payment_status}')
                
                # Clear the anonymous cart if it exists
                try:
                    # For guest orders, we need to find the cart that was used
                    # This is a bit tricky since guest doesn't have a permanent cart association
                    # We can use session or try to find recent carts without customers
                    print("Guest order completed without cart clearing (no permanent cart association)")
                except Exception as cart_error:
                    print(f'Error handling guest cart: {cart_error}')
                
                return Response({
                    'message': 'Payment completed (fallback)',
                    'order_id': order_id,
                    'session_id': session_id,
                    'guest_email': order.guest_email
                })
            
            return Response({'error': f'Stripe error: {str(stripe_error)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if payment was successful
        if session.payment_status == 'paid' or session.status == 'complete':
            print(f'Payment verified for guest order {order_id}')
            
            # Update order status to COMPLETE
            order.payment_status = Order.PAYMENT_STATUS_COMPLETE
            order.save()
            print(f'Guest order {order_id} status updated to: {order.payment_status}')
            
            # For guest orders, we don't have a permanent cart to clear
            # The cart will be cleaned up separately or remain as anonymous
            print("Guest order completed successfully")
            
            return Response({
                'message': 'Payment successful',
                'order_id': order_id,
                'session_id': session_id,
                'guest_email': order.guest_email
            })
        else:
            print(f'Guest payment not completed. Session status: {session.status}, payment_status: {session.payment_status}')
            return Response({'error': 'Payment not completed'}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"Error in guest_payment_success: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
