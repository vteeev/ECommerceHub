
from uuid import uuid4

from django.contrib import admin
from django.core.validators import MinValueValidator
from django.db import models

from MyShop import settings
from store.validators import validate_file_size


class Promotion(models.Model):
    description = models.CharField(max_length=255)
    discount = models.FloatField()


class Collection(models.Model):
    title = models.CharField(max_length=255)
    featured_product = models.ForeignKey(
        'Product', on_delete=models.SET_NULL, null=True, related_name='+')
    def __str__(self) -> str:
        return self.title
    class Meta:
        ordering = ['title']

class Product(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField()
    description = models.TextField(null=True, blank=True)
    unit_price = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(1)]
    )
    inventory = models.IntegerField()
    last_update = models.DateTimeField(auto_now=True)
    collection = models.ForeignKey(Collection, on_delete=models.PROTECT, related_name='products')
    promotions = models.ManyToManyField(Promotion, blank=True)

    def __str__(self) -> str:
        return self.title
    class Meta:
        ordering = ['title']

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(
        upload_to='store/images',
    validators =[validate_file_size])

class Customer(models.Model):
    MEMBERSHIP_BRONZE = 'B'
    MEMBERSHIP_SILVER = 'S'
    MEMBERSHIP_GOLD = 'G'

    MEMBERSHIP_CHOICES = [
        (MEMBERSHIP_BRONZE, 'Bronze'),
        (MEMBERSHIP_SILVER, 'Silver'),
        (MEMBERSHIP_GOLD, 'Gold'),
    ]
    phone = models.CharField(max_length=255)
    birth_date = models.DateField(null=True)
    membership = models.CharField(
        max_length=1, choices=MEMBERSHIP_CHOICES, default=MEMBERSHIP_BRONZE)
    user = models.OneToOneField(settings.dev.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self) -> str:
        return f'{self.user.first_name} {self.user.last_name}'

    @admin.display(ordering='user__first_name')
    def first_name(self) -> str:
        return self.user.first_name
    @admin.display(ordering='user__last_name')
    def last_name(self) -> str:
        return self.user.last_name

    class Meta:
        ordering = ['user__first_name', 'user__last_name']
        permissions = [
            ('view_history', 'Can view history')
        ]

class Order(models.Model):
    PAYMENT_STATUS_PENDING = 'P'
    PAYMENT_STATUS_COMPLETE = 'C'
    PAYMENT_STATUS_FAILED = 'F'
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, 'Pending'),
        (PAYMENT_STATUS_COMPLETE, 'Complete'),
        (PAYMENT_STATUS_FAILED, 'Failed')
    ]

    placed_at = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(
        max_length=1, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_STATUS_PENDING)
    total_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0
    )
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, null=True, blank=True)
    
    # Guest order fields
    guest_email = models.EmailField(null=True, blank=True)
    guest_first_name = models.CharField(max_length=255, null=True, blank=True)
    guest_last_name = models.CharField(max_length=255, null=True, blank=True)
    guest_phone = models.CharField(max_length=255, null=True, blank=True)

    def calculate_subtotal(self):
        """Wylicza sumę produktów bez dostawy"""
        return sum(item.unit_price * item.quantity for item in self.items.all())
    
    def calculate_delivery_cost(self):
        """Wylicza koszt dostawy - darmowa powyżej 250 zł"""
        subtotal = self.calculate_subtotal()
        return 0 if subtotal >= 250 else 15
    
    def calculate_total(self):
        """Wylicza całkowitą kwotę zamówienia"""
        return self.calculate_subtotal() + self.calculate_delivery_cost()

    class Meta:
        # Custom Permission
        permissions = [
            ('cancel_order', 'Can cancel Order'),
        ]

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='orderitems')
    quantity = models.PositiveSmallIntegerField()
    unit_price = models.DecimalField(max_digits=6, decimal_places=2)


class Address(models.Model):
    street = models.CharField(max_length=255)
    house_number = models.PositiveIntegerField(default=1)
    apartment_number = models.PositiveIntegerField(null=True)
    city = models.CharField(max_length=255)
    post_code = models.CharField(max_length=8)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True)
    
    # Guest address fields - these are used when customer is null
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, related_name='shipping_address')
'''
class Payment(models.Model):
    cart_number = models.CharField(max_length=20)
    date = models.CharField(max_length=6)
    cvv = models.CharField(max_length=4)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE)
'''


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='cart'
    )


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)], default=1
    )

    class Meta:
        unique_together = [['cart', 'product']]

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    date = models.DateField(auto_now_add=True)