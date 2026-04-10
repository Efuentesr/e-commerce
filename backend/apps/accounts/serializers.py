from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer del perfil del usuario autenticado. Soporta cambio de contraseña opcional."""
    current_password    = serializers.CharField(write_only=True, required=False)
    new_password        = serializers.CharField(write_only=True, required=False, min_length=6)
    new_password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'phone',
                  'current_password', 'new_password', 'new_password_confirm']
        read_only_fields = ['id', 'username', 'is_staff']

    def validate(self, data):
        cp  = data.get('current_password')
        np  = data.get('new_password')
        npc = data.get('new_password_confirm')
        # Solo validar si el usuario quiso cambiar la contraseña
        if cp or np or npc:
            if not cp:
                raise serializers.ValidationError({'current_password': 'Ingresá tu contraseña actual.'})
            if not self.instance.check_password(cp):
                raise serializers.ValidationError({'current_password': 'Contraseña actual incorrecta.'})
            if not np:
                raise serializers.ValidationError({'new_password': 'Ingresá la nueva contraseña.'})
            if np != npc:
                raise serializers.ValidationError({'new_password_confirm': 'Las contraseñas no coinciden.'})
        return data

    def update(self, instance, validated_data):
        validated_data.pop('current_password', None)
        validated_data.pop('new_password_confirm', None)
        new_password = validated_data.pop('new_password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios."""
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'phone']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
