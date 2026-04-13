from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from .models import Category, Product
from .serializers import CategorySerializer, ProductListSerializer, ProductDetailSerializer


class CategoryListView(generics.ListAPIView):
    """Lista todas las categorías disponibles."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Sin paginación para categorías


class ProductListView(generics.ListAPIView):
    """Lista productos activos con filtros por categoría, búsqueda y precio."""
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Calcular rating y conteo directo en la BD (evita prefetch de todas las reseñas)
        queryset = (
            Product.objects
            .filter(is_active=True)
            .select_related('category')
            .prefetch_related('images')
            .annotate(avg_rating=Avg('reviews__rating'), num_reviews=Count('reviews'))
        )

        # Filtro por categoría (slug)
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        # Búsqueda por nombre o descripción
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Filtro por rango de precio
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Ordenamiento
        ordering = self.request.query_params.get('ordering', '-created_at')
        valid_orderings = ['price', '-price', 'name', '-name', '-created_at']
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ProductDetailView(generics.RetrieveAPIView):
    """Detalle completo de un producto con imágenes y reseñas."""
    queryset = Product.objects.filter(is_active=True).prefetch_related('images', 'reviews__user')
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
