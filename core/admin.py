
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.contenttypes.admin import GenericTabularInline

from .models import User
from likes.models import LinkedItem
from store.models import Product
from tags.models import TaggedItem
from store.admin import AdminProduct, ProductImageInline


# Register your models here.
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "usable_password", "password1", "password2", "email", "first_name", "last_name"),
            },
        ),
    )
class TagInline(GenericTabularInline):
    autocomplete_fields = ['tag']
    model = TaggedItem
    extra = 0

class CustomProductAdmin(AdminProduct):
    inlines = [TagInline, ProductImageInline]

admin.site.unregister(Product)

admin.site.register(Product, CustomProductAdmin)