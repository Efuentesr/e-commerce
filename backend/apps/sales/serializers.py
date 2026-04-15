from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory
from apps.products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_code', 'price', 'quantity', 'subtotal']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True, default=None)

    class Meta:
        model = OrderStatusHistory
        fields = ['from_status', 'to_status', 'changed_by_username', 'changed_at', 'note']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer completo de una orden incluyendo sus items e historial de estados."""
    items = OrderItemSerializer(many=True, read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True, default=None)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_username', 'customer_phone', 'status',
            'total_price', 'discount', 'final_price',
            'items', 'history', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'customer', 'total_price', 'created_at', 'updated_at']


class OrderListSerializer(serializers.ModelSerializer):
    """Serializer compacto para listado de órdenes."""
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'customer_username', 'status',
            'total_price', 'discount', 'final_price',
            'item_count', 'created_at',
        ]

    def get_item_count(self, obj):
        return obj.items.count()
