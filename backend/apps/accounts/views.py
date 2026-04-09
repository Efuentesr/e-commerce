from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .serializers import UserProfileSerializer, RegisterSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Retorna y permite actualizar el perfil del usuario autenticado."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class RegisterView(generics.CreateAPIView):
    """Registro de nuevos usuarios clientes."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'message': 'Usuario creado exitosamente.', 'username': user.username},
            status=status.HTTP_201_CREATED
        )
