import json
import os
import stripe
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Order  # Import the Order model

endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET_TEST')
stripe.api_key = os.getenv('STRIPE_SECRET_KEY_TEST')

@csrf_exempt
def create_checkout_session(request):
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': 'pln',
                'product_data': {'name': 'Produkt testowy'},
                'unit_amount': 1000,  # 10.00 PLN
            },
            'quantity': 1,
        }],
        mode='payment',
        success_url='http://localhost:8000/success/',
        cancel_url='http://localhost:8000/cancel/',
    )
    return JsonResponse({'id': session.id})

@csrf_exempt
def my_webhook_view(request):
    payload = request.body
    event = None

    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    if endpoint_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
            print('Verified webhook!')
        except ValueError as e:
            print('ValueError:', e)
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            print('⚠️  Webhook signature verification failed.' + str(e))
            return JsonResponse({'success': False})
        except Exception as e:
            print('Unexpected error:', e)
            return HttpResponse(status=500)
        data = event['data']['object']
        eventType = event['type']
    else:
        data = payload['object']
        event['type'] = payload['type']
    # Obsługa eventów
    try:
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            print('PaymentIntent was successful!')
        elif event['type'] == 'payment_method.attached':
            payment_method = event['data']['object']
            print('PaymentMethod was attached!')
        elif event['type'] == 'charge.succeeded':
            charge = event['data']['object']
            print('Charge succeeded!')
        elif event['type'] == 'charge.updated':
            charge = event['data']['object']
            print('Charge updated!')
        elif event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            print(f'Checkout session completed! Session ID: {session["id"]}')
            order_id = session['metadata'].get('order_id')
            print(f'Order ID from metadata: {order_id}')
            
            from store.models import Order
            try:
                order = Order.objects.get(id=order_id)
                print(f'Found order {order_id}, current status: {order.payment_status}')
                
                order.payment_status = Order.PAYMENT_STATUS_COMPLETE
                order.save()
                print(f'Order {order_id} status updated to: {order.payment_status}')
                
                # Clear the cart now that payment is successful
                if hasattr(order.customer, 'cart') and order.customer.cart:
                    cart_id = order.customer.cart.id
                    order.customer.cart.delete()
                    print(f'Cart {cart_id} deleted for customer {order.customer.id}')
                else:
                    print(f'No cart found for customer {order.customer.id}')
                
                print(f'Order {order_id} marked as complete and cart cleared')
            except Order.DoesNotExist:
                print(f'Order {order_id} not found')
            except Exception as e:
                print(f'Error processing order {order_id}: {e}')
        else:
            print('Unhandled event type {}'.format(event['type']))
    except Exception as e:
        print('Error handling event:', e)
        return HttpResponse(status=500)

    return HttpResponse(status=200)