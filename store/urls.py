from pprint import pprint
from django.urls import path, include
from rest_framework_nested import routers
from . import views, webhook

# URLConf

router = routers.DefaultRouter()
router.register('products', views.ProductViewSet, basename='products')
router.register('collections', views.CollectionViewSet, basename='collections')
router.register('carts', views.CartViewSet, basename='carts')
router.register('customers', views.CustomerViewSet, basename='customers')
router.register('orders', views.OrderViewSet, basename='orders')
router.register('addresses', views.AddressViewSet, basename='addresses')


carts_router = routers.NestedDefaultRouter(router, r'carts', lookup='cart')
carts_router.register('items', views.CartItemViewSet, basename='cart-items')

products_router = routers.NestedSimpleRouter(router, r'products', lookup='product')
products_router.register('reviews', views.ReviewViewSet, basename='product-reviews')
products_router.register('images', views.ProductImageViewSet, basename='products-images')

urlpatterns = (
    router.urls
    + products_router.urls
    + carts_router.urls
    + [
        path('webhook/', webhook.my_webhook_view, name='stripe-webhook'),
        path('create-checkout-session/', views.create_checkout_session, name='create-checkout-session'),
        path('cancel-order/', views.cancel_order, name='cancel-order'),
        path('payment-success/', views.payment_success, name='payment-success'),
        path('complete-order/', views.complete_order, name='complete-order'),
        
        # Guest checkout endpoints
        path('guest-order/', views.create_guest_order, name='create-guest-order'),
        path('guest-checkout-session/', views.create_guest_checkout_session, name='create-guest-checkout-session'),
        path('guest-payment-success/', views.guest_payment_success, name='guest-payment-success'),
    ]
)
'''
urlpatterns = [
    #path('products/', views.ProductList.as_view()),
    #path('products/<int:pk>', views.ProductDetail.as_view()),
    #path('collections/', views.CollectionList.as_view()),
    #path('collections/<int:pk>', views.CollectionDetail.as_view(), name='collection-detail'),
]
'''