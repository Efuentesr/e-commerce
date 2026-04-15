from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal

from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory
from .serializers import CartSerializer, OrderSerializer, OrderListSerializer
from apps.products.models import Product


# ─────────────────────────── CARRITO ───────────────────────────

class CartView(APIView):
    """Retorna el carrito del usuario autenticado."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


class CartAddItemView(APIView):
    """Agrega o incrementa un producto en el carrito."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'product_id es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id, is_active=True)

        if quantity < 1:
            return Response({'error': 'La cantidad debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity

        # Verificar disponibilidad de stock
        if item.quantity > product.available_stock:
            return Response(
                {'error': f'Stock insuficiente. Disponible: {product.available_stock}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.save()
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


class CartRemoveItemView(APIView):
    """Elimina un item del carrito."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        item_id = request.data.get('item_id')
        if not item_id:
            return Response({'error': 'item_id es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.delete()

        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


class SyncCartView(APIView):
    """
    Sincroniza el carrito de localStorage con la base de datos.
    Recibe: [{"product_id": X, "quantity": Y}, ...]
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        items_data = request.data.get('items', [])
        if not isinstance(items_data, list):
            return Response({'error': 'Se esperaba una lista de items.'}, status=status.HTTP_400_BAD_REQUEST)

        cart, _ = Cart.objects.get_or_create(user=request.user)

        for item_data in items_data:
            product_id = item_data.get('product_id')
            quantity = int(item_data.get('quantity', 1))

            try:
                product = Product.objects.get(id=product_id, is_active=True)
            except Product.DoesNotExist:
                continue

            cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
            if not created:
                cart_item.quantity += quantity
            else:
                cart_item.quantity = quantity

            # Limitar al stock disponible
            cart_item.quantity = min(cart_item.quantity, product.available_stock)
            if cart_item.quantity > 0:
                cart_item.save()
            else:
                cart_item.delete()

        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


# ─────────────────────────── ÓRDENES ───────────────────────────

def _registrar_historial(order, from_status, to_status, user, note):
    """Crea un registro de cambio de estado en el historial de la orden."""
    OrderStatusHistory.objects.create(
        order=order,
        from_status=from_status,
        to_status=to_status,
        changed_by=user,
        note=note,
    )

class OrderListCreateView(generics.ListCreateAPIView):
    """Lista las órdenes del usuario (admin ve todas). Crea una orden desde el carrito."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return OrderListSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().select_related('customer').prefetch_related('items')
        return Order.objects.filter(customer=user).prefetch_related('items')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Crea una orden a partir de los items del carrito del usuario."""
        cart = get_object_or_404(Cart, user=request.user)
        cart_items = cart.items.select_related('product').all()

        if not cart_items.exists():
            return Response(
                {'error': 'El carrito está vacío.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar stock antes de crear la orden
        errores = []
        for item in cart_items:
            if item.quantity > item.product.available_stock:
                errores.append(
                    f"'{item.product.name}': solo quedan {item.product.available_stock} unidades."
                )
        if errores:
            return Response({'error': 'Stock insuficiente.', 'detalles': errores}, status=status.HTTP_400_BAD_REQUEST)

        # Calcular total
        total = sum(item.product.price * item.quantity for item in cart_items)

        # Crear la orden
        order = Order.objects.create(
            customer=request.user,
            status='creada',
            total_price=total,
        )

        # Crear los items de la orden con precio histórico
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                price=item.product.price,
                quantity=item.quantity,
            )

        # Vaciar el carrito
        cart.items.all().delete()

        # Registrar creación en historial
        _registrar_historial(order, None, 'creada', request.user, f"Orden creada por {request.user.username}")

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    """Detalle de una orden y cambios de estado/descuento."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().prefetch_related('items__product', 'history__changed_by')
        return Order.objects.filter(customer=user).prefetch_related('items__product', 'history__changed_by')

    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        action = request.data.get('action')
        user = request.user

        # ── Editar descuento (solo admin, solo en estado creada) ──
        if action == 'discount':
            if not user.is_staff:
                return Response({'error': 'Solo el administrador puede editar el descuento.'}, status=403)
            if order.status != 'creada':
                return Response({'error': 'El descuento solo se puede editar en órdenes "creada".'}, status=400)
            try:
                discount = Decimal(str(request.data.get('discount', 0)))
                if discount < 0 or discount > order.total_price:
                    return Response({'error': 'Descuento inválido.'}, status=400)
                order.discount = discount
                order.save()
                _registrar_historial(order, 'creada', 'creada', user, f"Descuento aplicado por {user.username}: ${discount}")
            except Exception:
                return Response({'error': 'Valor de descuento inválido.'}, status=400)

        # ── Aprobar (cliente, solo en estado creada) ──
        elif action == 'aprobar':
            if order.customer != user:
                return Response({'error': 'Solo el cliente propietario puede aprobar la orden.'}, status=403)
            if order.status != 'creada':
                return Response({'error': 'Solo se pueden aprobar órdenes en estado "creada".'}, status=400)

            # Reservar el stock (aumentar separated_qty)
            for item in order.items.select_related('product').all():
                product = item.product
                if item.quantity > product.available_stock:
                    return Response(
                        {'error': f'Stock insuficiente para "{product.name}". Disponible: {product.available_stock}'},
                        status=400
                    )
                product.separated_qty += item.quantity
                product.save()

            order.status = 'aprobada'
            order.save()
            _registrar_historial(order, 'creada', 'aprobada', user, f"Orden aprobada por {user.username}")

        # ── Pagar (solo admin, solo en estado aprobada) ──
        elif action == 'pagar':
            if not user.is_staff:
                return Response({'error': 'Solo el administrador puede marcar una orden como pagada.'}, status=403)
            if order.status != 'aprobada':
                return Response({'error': 'Solo se pueden pagar órdenes en estado "aprobada".'}, status=400)

            # Descontar stock definitivamente
            for item in order.items.select_related('product').all():
                product = item.product
                product.stock -= item.quantity
                product.separated_qty -= item.quantity
                product.save()

            order.status = 'pagada'
            order.save()
            _registrar_historial(order, 'aprobada', 'pagada', user, f"Pago confirmado por {user.username}")

        # ── Entregar (solo admin, solo en estado pagada) ──
        elif action == 'entregar':
            if not user.is_staff:
                return Response({'error': 'Solo el administrador puede marcar una orden como entregada.'}, status=403)
            if order.status != 'pagada':
                return Response({'error': 'Solo se pueden marcar como entregadas las órdenes en estado "pagada".'}, status=400)

            order.status = 'entregada'
            order.save()
            _registrar_historial(order, 'pagada', 'entregada', user, f"Orden marcada como entregada por {user.username}")

        # ── Anular ──
        elif action == 'anular':
            # Solo admin puede anular órdenes aprobadas o pagadas
            if order.status in ('aprobada', 'pagada') and not user.is_staff:
                return Response({'error': 'Solo el administrador puede anular esta orden.'}, status=403)

            # Clientes solo pueden anular sus propias órdenes en estado creada
            if order.status == 'creada' and not (user.is_staff or order.customer == user):
                return Response({'error': 'No tenés permiso para anular esta orden.'}, status=403)

            # Órdenes ya anuladas no se pueden volver a anular
            if order.status == 'anulada':
                return Response({'error': 'La orden ya está anulada.'}, status=400)

            # Devolver stock según el estado previo
            if order.status == 'aprobada':
                # Liberar el stock reservado (separated_qty)
                for item in order.items.select_related('product').all():
                    product = item.product
                    product.separated_qty = max(0, product.separated_qty - item.quantity)
                    product.save()

            elif order.status == 'pagada':
                # Devolver el stock al inventario (el descuento ya se había aplicado al stock)
                for item in order.items.select_related('product').all():
                    product = item.product
                    product.stock += item.quantity
                    product.save()

            prev_status = order.status
            order.status = 'anulada'
            order.save()
            _registrar_historial(order, prev_status, 'anulada', user, f"Orden anulada por {user.username} desde estado '{prev_status}'")

        else:
            return Response({'error': f'Acción "{action}" no reconocida.'}, status=400)

        serializer = self.get_serializer(order)
        return Response(serializer.data)
