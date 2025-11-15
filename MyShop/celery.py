import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MyShop.settings.dev')

celery =Celery('MyShop')
celery.config_from_object('django.conf:settings', namespace='CELERY')
celery.autodiscover_tasks()
