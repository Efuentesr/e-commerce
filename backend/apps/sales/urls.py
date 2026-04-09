from django.urls import path
from .views import (
    CartView, CartAddItemView, CartRemoveItemView, SyncCartView,
    OrderListCreateView, OrderDetailView,
)

urlpatterns = [
    # Carrito
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/add_item/', CartAddItemView.as_view(), name='cart-add-item'),
    path('cart/remove_item/', CartRemoveItemView.as_view(), name='cart-remove-item'),
    path('sync-cart/', SyncCartView.as_view(), name='sync-cart'),
    # Órdenes
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
