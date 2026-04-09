# apps/products/models.py


from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from django.utils.text import slugify # Importamos la herramienta mágica
from simple_history.models import HistoricalRecords # <--- El motor de logs

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    # history = HistoricalRecords() # Registra cambios en precio y stock

    def __str__(self):
        return self.name

# --- 2. CATEGORÍAS ---
class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, db_index=True) # Para URLs amigables joyas-y-bisuteria

    # history = HistoricalRecords() # Registra cambios en precio y stock

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

# --- 3. PRODUCTOS ---
class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255, db_index=True) # Indexado para búsquedas rápidas
    slug = models.SlugField(unique=True, db_index=True, blank=True) # Añadimos el slug
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    separated_qty = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    history = HistoricalRecords() # Registra cambios en precio y stock

    def save(self, *args, **kwargs):
        # Si no tiene slug (o si cambió el nombre), lo generamos automáticamente
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/') # Requiere Pillow instalado
    is_feature = models.BooleanField(default=False) # Foto principal
    alt_text = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
            return f"Imagen para {self.product.name}"

class Review(models.Model):
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
#    user = models.ForeignKey(User, on_delete=models.CASCADE)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
