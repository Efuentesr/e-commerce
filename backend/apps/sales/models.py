from django.db import models
from django.conf import settings
from apps.products.models import Product
from decimal import Decimal


class Cart(models.Model):
    """Carrito de compras persistente (uno por usuario autenticado)."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Carrito de {self.user.username}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    """Item individual dentro del carrito."""
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


class Order(models.Model):
    """
    Orden de compra con máquina de estados:
    creada → aprobada → pagada → entregada
    creada → anulada
    aprobada → anulada (solo admin)
    pagada  → anulada  (solo admin)
    """
    STATUS_CHOICES = (
        ('creada', 'Creada'),
        ('aprobada', 'Aprobada'),
        ('pagada', 'Pagada'),
        ('entregada', 'Entregada'),
        ('anulada', 'Anulada'),
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='creada', db_index=True
    )
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def final_price(self):
        """Precio final después de aplicar el descuento."""
        return max(Decimal('0.00'), self.total_price - self.discount)

    def __str__(self):
        return f"Orden #{self.id} - {self.customer.username} ({self.status})"


class OrderItem(models.Model):
    """Item de una orden. Guarda el precio histórico al momento de la compra."""
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)  # No borrar si hay orden
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Precio al momento de compra
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


class OrderStatusHistory(models.Model):
    """Registro de cada cambio de estado en una orden."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='history')
    from_status = models.CharField(max_length=20, null=True, blank=True)  # null en la creación inicial
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='order_history'
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255)

    class Meta:
        ordering = ['changed_at']

    def __str__(self):
        return f"Orden #{self.order_id}: {self.from_status} → {self.to_status}"


class Payment(models.Model):
    """Registro de pago asociado a una orden."""
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pago de Orden #{self.order.id} - {self.status}"
