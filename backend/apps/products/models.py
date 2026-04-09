from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from django.utils.text import slugify
from simple_history.models import HistoricalRecords


class Supplier(models.Model):
    """Proveedor de productos."""
    name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    """Categoría de productos con URL amigable."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, db_index=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Producto del catálogo.
    - separated_qty: unidades reservadas por órdenes aprobadas pero no pagadas.
    - available_stock: stock real disponible para nuevas compras.
    """
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, db_index=True, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    separated_qty = models.IntegerField(default=0)  # Reservado por órdenes aprobadas
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    history = HistoricalRecords()  # Auditoría de cambios en precio y stock

    @property
    def available_stock(self):
        """Stock disponible descontando lo reservado por órdenes aprobadas."""
        return max(0, self.stock - self.separated_qty)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    """Imágenes de un producto. Una puede ser la foto principal."""
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')
    is_feature = models.BooleanField(default=False)  # Foto principal del producto
    alt_text = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Imagen de {self.product.name}"


class Review(models.Model):
    """Reseña de un producto hecha por un usuario."""
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')  # Un usuario, una reseña por producto

    def __str__(self):
        return f"Reseña de {self.user.username} para {self.product.name} ({self.rating}★)"
