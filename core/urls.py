from django.urls import path
from django.views.generic import TemplateView

from InternetShop.views import HelloView

urlpatterns = [path('', TemplateView.as_view(template_name='core/index.html'))]