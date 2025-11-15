
from django.db.models.signals import post_save
from django.conf import settings
from django.dispatch import receiver
from store.models import Customer, Cart


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_customer_for_new_user(sender, **kwargs):
    if kwargs['created']:
        customer = Customer.objects.create(user=kwargs['instance'])

@receiver(post_save, sender=Customer)
def create_customer_cart(sender, instance, created, **kwargs):
    if created:
        Cart.objects.create(customer=instance)