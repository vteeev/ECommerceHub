import os
from .common import *

DEBUG = False

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError('SECRET_KEY environment variable must be set in production')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD')
    }
}

if not all([os.getenv('DB_NAME'), os.getenv('DB_HOST'), os.getenv('DB_USER'), os.getenv('DB_PASSWORD')]):
    raise ValueError('Database environment variables must be set in production')