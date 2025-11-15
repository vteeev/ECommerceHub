import logging

import requests
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.db.models import Q, F, Func, Value, ExpressionWrapper
from django.db.models.aggregates import Min, Count
from django.db.models.fields import DecimalField
from django.db.models.functions import Concat
from django.shortcuts import render
from django.http import HttpRequest, HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.views import APIView

from InternetShop.tasks import notify_customers
from store.models import Product, OrderItem, Customer, Order
from tags.models import TaggedItem

from .tasks import notify_customers
# Create your views here.

logger = logging.getLogger(__name__) # InternetShop.views

class HelloView(APIView):
    def get(self, request):
        try:
            logger.info('Calling httpbin')
            response = requests.get('https://httpbin.org/delay/1')
            logger.info(f'Recived the response')
            data = response.json()
        except requests.ConnectionError:
            logger.critical('httpbin is offline')
        return render(request, 'hello.html', {'name': 'Piotrek'})

'''
def say_hello(request):
    # product
    #   queryset = Product.objects.filter(title__icontains='coffee')
    #   queryset = Product.objects.filter(Q(name__icontains='coffe') | Q(inventory__gt=20))
    #   queryset = Product.objects.filter(inventory=F('unit_price'))

    # unit dec title asc thaks reverse()
    # order_by()
    #   queryset = Product.objects.order_by('unit_price','-title').reverse()
    #   product = Product.objects.order_by('unit_price')[0]

    # 5 firt
    #   queryset = Product.objects.all()[:5]

    # values
    #   queryset = Product.objects.values('id','title', 'collection__title')
    #   queryset = Product.objects.values_list('id', 'title', 'collection__title')

    # Select all products that were ordered
    #   queryset = Product.objects.filter(
    #       id__in=OrderItem.objects.values('product_id').distinct()).order_by('title')

    # Optimization
    #   queryset = Product.objects.only('id', 'title')
    # defer - load 'description' only when its needed
    #   queryset = Product.objects.defer('description')

    # Select Related Objects
    # select_related (1) - product has 1 collection
    # prefetch_related (n) - product can have many promotions
    #   queryset = Product.objects.select_related('collecion__someOtherField').all()
    #   queryset = Product.objects.prefetch_related(
    #       'promotions').select_related('collection').all().order_by('collection__title')

    # Get 5 last orders with their customer, items
    #   queryset = Order.objects.select_related('customer').prefetch_related('orderitem_set__product').order_by('-placed_at')[:5]

    # Aggregate Count, Min, Max, Avg
    #   number = Product.objects.aggregate(count=Count('id'), min_price=Min('unit_price'))
    #   number = Product.objects.filter(collection__id=1).aggregate(count=Count('id'))
    # annotate() z funkcjami agregujacymi takze dodaje nowe pole do obiektu
    # tutaj do obiektu customer dodaje pole new_id z nowo utworzonym id
    #   queryset = Customer.objects.annotate(new_id=F('id'))

    #   queryset = Customer.objects.annotate(
    #       full_name=Func(
    #            F('first_name'), Value(' '), F('last_name'), function='CONCAT')
    #   )
    #   queryset = Customer.objects.annotate(
    #       full_name=Concat('first_name', Value(' '), 'last_name')
    #   )

    # EXPRESIONWRAPPER
    #   discounted_price = ExpressionWrapper(F('unit_price')*0.8, output_field=DecimalField())
    #   queryset = Product.objects.annotate(
    #        discounted_price = discounted_price
    #   )

    #CONTENTTYPE
    #   content_type = ContentType.objects.get_for_model(Product)
    #   queryset = TaggedItem.objects \
    #       .select_related('tag') \
    #        .filter(
    #            content_type=content_type,
    #           object_id=1
    #   )
    #       \/
    #       \/ Dodalem TaggedItemManager(models.Manager)
    #       \/

    queryset = TaggedItem.objects.get_tags_for(Product, 1)
    return render(request,'hello.html',{'products': list(queryset)})
'''
