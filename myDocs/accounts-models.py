# apps/acccounts/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models

# --- 1. USUARIOS ---
class User(AbstractUser):
    # El username ya es único e indexado por defecto en Django
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return self.username
    
    
class Address(models.Model):
    user = models.ForeignKey(User, related_name='addresses', on_delete=models.CASCADE)
    address_line1 = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    is_default = models.BooleanField(default=False)