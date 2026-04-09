from django.contrib import admin
from .models import Category, Product, ProductImage, Review, Supplier


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}
    list_display = ['name', 'slug']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline]
    prepopulated_fields = {'slug': ('name',)}
    list_display = ['code', 'name', 'category', 'price', 'stock', 'separated_qty', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'code']
    readonly_fields = ['separated_qty']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_email', 'phone']
