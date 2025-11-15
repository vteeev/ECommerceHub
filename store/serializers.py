
from decimal import Decimal

from django.db import transaction
from rest_framework import serializers, viewsets
from store.models import Product, Collection, Review, Cart, CartItem, Customer, Order, OrderItem, ProductImage, Address
from store.signals import order_created


class CollectionSerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Collection
        fields = ['id', 'title', 'products_count']

class ProductImageSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        product_id = self.context['product_id']
        return ProductImage.objects.create(product_id=product_id, **validated_data)
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'title', 'unit_price', 'inventory', 'price_with_tax', 'collection', 'images']
    price_with_tax =serializers.SerializerMethodField(method_name='get_price_with_tax')
    collection = serializers.StringRelatedField()
    def get_price_with_tax(self, product: Product):
        return product.unit_price * Decimal(1.1)


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields =['id', 'date', 'name', 'description']

    def create(self, validated_data):
        product_id = self.context['product_id']
        return Review.objects.create(product_id=product_id, **validated_data)

class SimpleProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'title', 'unit_price', 'inventory']
class CartItemSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializer()
    total_price = serializers.SerializerMethodField(method_name='get_total_price')

    def get_total_price(self, cart_item: CartItem):
        return cart_item.quantity * cart_item.product.unit_price

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'total_price']

class AddCartItemSearializer(serializers.ModelSerializer):
    product_id =serializers.IntegerField()

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError('Product does not exist')
        return value


    def save(self, **kwargs):
        cart_id = self.context['cart_id']
        product_id = self.validated_data['product_id']
        quantity = self.validated_data['quantity']
        product = Product.objects.get(id=product_id)
        try:
            cart_item = CartItem.objects.get(cart_id=cart_id, product_id=product_id)
            new_quantity = cart_item.quantity + quantity

            if new_quantity > product.inventory:
                raise serializers.ValidationError("Not enough items in stock.")

            cart_item.quantity = new_quantity
            cart_item.save()
            self.instance = cart_item
        except CartItem.DoesNotExist:
            if quantity > product.inventory:
                raise serializers.ValidationError("Not enough items in stock.")

            self.instance = CartItem.objects.create(cart_id=cart_id, product_id=product_id, quantity=quantity)
            #Create a new item
        return self.instance

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'quantity']

class UpdateCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['quantity']
class CartSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField(method_name='get_total_price')

    def get_total_price(self, cart):
        return  sum([item.quantity * item.product.unit_price for item in cart.items.all()])

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price']

class CustomerSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    cart_id = serializers.SerializerMethodField()  # Dodaj to pole

    class Meta:
        model = Customer
        fields = ['id', 'user_id', 'phone', 'birth_date', 'membership', 'cart_id']  # Dodaj cart_id do pól

    def get_cart_id(self, obj):
        if hasattr(obj, 'cart') and obj.cart:
            return str(obj.cart.id)
        return None

class OrderItemSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializer()
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'unit_price', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    #customer = CustomerSerializer(read_only=True)
    items = OrderItemSerializer(many=True)
    class Meta:
        model = Order
        fields = ['id', 'customer', 'placed_at', 'payment_status', 'total_price', 'items']

class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['payment_status']

class CreateOrderSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()

    def validate_cart_id(self, cart_id):
        if not Cart.objects.filter(pk=cart_id).exists():
            raise serializers.ValidationError('Cart does not exist')
        if CartItem.objects.filter(cart_id=cart_id).count() == 0:
            raise serializers.ValidationError('Cart is empty')
        return cart_id

    def save(self, **kwargs):
        with transaction.atomic():
            cart_id = self.validated_data['cart_id']

            customer= Customer.objects.get(user_id=self.context['user_id'])
            order = Order.objects.create(customer=customer)

            cart_items = CartItem.objects\
                          .select_related('product')\
                          .filter(cart_id=cart_id)
            order_items=[
                OrderItem(
                    order = order,
                    product = item.product,
                    unit_price = item.product.unit_price,
                    quantity = item.quantity
                ) for item in cart_items
            ]
            OrderItem.objects.bulk_create(order_items)

            # Calculate and save total price after creating order items
            order.total_price = order.calculate_total()
            order.save()

            # DON'T DELETE CART HERE - only delete after successful payment
            # Cart.objects.filter(pk=cart_id).delete()

            order_created.send_robust(self.__class__, order=order)
            return order

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'street', 'post_code', 'house_number', 'apartment_number','city', 'post_code']


class GuestOrderSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()
    guest_email = serializers.EmailField()
    guest_first_name = serializers.CharField(max_length=255)
    guest_last_name = serializers.CharField(max_length=255)
    guest_phone = serializers.CharField(max_length=255)
    
    # Address fields
    street = serializers.CharField(max_length=255)
    house_number = serializers.IntegerField()
    apartment_number = serializers.IntegerField(required=False, allow_null=True)
    city = serializers.CharField(max_length=255)
    post_code = serializers.CharField(max_length=8)

    def validate_cart_id(self, cart_id):
        if not Cart.objects.filter(pk=cart_id).exists():
            raise serializers.ValidationError('Cart does not exist')
        if CartItem.objects.filter(cart_id=cart_id).count() == 0:
            raise serializers.ValidationError('Cart is empty')
        return cart_id

    def save(self, **kwargs):
        from django.db import transaction
        from store.signals import order_created
        
        with transaction.atomic():
            cart_id = self.validated_data['cart_id']

            # Create guest order
            order = Order.objects.create(
                customer=None,  # No customer for guest orders
                guest_email=self.validated_data['guest_email'],
                guest_first_name=self.validated_data['guest_first_name'],
                guest_last_name=self.validated_data['guest_last_name'],
                guest_phone=self.validated_data['guest_phone']
            )

            # Create guest address linked to this order
            address = Address.objects.create(
                order=order,
                customer=None,
                street=self.validated_data['street'],
                house_number=self.validated_data['house_number'],
                apartment_number=self.validated_data.get('apartment_number'),
                city=self.validated_data['city'],
                post_code=self.validated_data['post_code']
            )

            # Create order items from cart
            cart_items = CartItem.objects\
                          .select_related('product')\
                          .filter(cart_id=cart_id)
            order_items=[
                OrderItem(
                    order = order,
                    product = item.product,
                    unit_price = item.product.unit_price,
                    quantity = item.quantity
                ) for item in cart_items
            ]
            OrderItem.objects.bulk_create(order_items)

            # Calculate and save total price after creating order items
            order.total_price = order.calculate_total()
            order.save()

            # DON'T DELETE CART HERE - only delete after successful payment
            # Cart.objects.filter(pk=cart_id).delete()

            order_created.send_robust(self.__class__, order=order)
            return order
