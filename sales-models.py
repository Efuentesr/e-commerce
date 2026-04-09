# apps/sales/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from apps.products.models import Product
from decimal import Decimal

class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total_cart = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    def __str__(self):
        return f"Carrito de {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

# --- 5. ORDENES ---
class Order(models.Model):
    STATUS_CHOICES = (
        ('creada', 'Creada'),
        ('anulada', 'Anulada'),
        ('aprobada', 'Aprobada'),
        ('pagada', 'Pagada'),
    )

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='creada', db_index=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Tracking de fechas
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Orden predeterminado: por estado y luego por fecha más reciente
        ordering = ['status', '-created_at']

    @property
    def final_price(self):
        return self.total_price - Decimal(self.discount)

    def __str__(self):
        return f"Orden {self.id} - {self.customer.username} ({self.status})"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT) # No borrar producto si hay orden
    price = models.DecimalField(max_digits=10, decimal_places=2) # Precio histórico al momento de compra
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
class Payment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    method = models.CharField(max_length=50) # Ej: 'Stripe', 'PayPal', 'MercadoPago'
    transaction_id = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50) # 'Completed', 'Pending', 'Failed'
    created_at = models.DateTimeField(auto_now_add=True)