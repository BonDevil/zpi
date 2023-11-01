from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from accounts.models import AppUser

UserModel = AppUser


class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ('email', 'username', 'password')  # Explicitly state the fields
        extra_kwargs = {'password': {'write_only': True}}  # Password should be write-only

    def create(self, clean_data):
        return UserModel.objects.create_user(email=clean_data['email'],
                                             password=clean_data['password'],
                                             username=clean_data['username'])


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)  # Although not returned, good to be explicit

    def check_user(self, clean_data):
        user = authenticate(username=clean_data['email'], password=clean_data['password'])
        if not user:
            raise ValidationError('Invalid login credentials')
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ('email', 'username')

    def is_valid(self, raise_exception=False):
        # Call the parent class's is_valid method
        super_valid = super(UserSerializer, self).is_valid(raise_exception=False)

        # Check for unexpected parameters
        extra_fields = set(self.initial_data.keys()) - set(self.fields.keys())
        if extra_fields:
            if not hasattr(self, '_errors'):
                self._errors = {}
            self._errors['extra_fields'] = [f"Unexpected parameters: {', '.join(extra_fields)}"]

        if self._errors and raise_exception:
            raise serializers.ValidationError(self.errors)

        return super_valid and not bool(self._errors)

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    extra_kwargs = {'password': {'write_only': True}}  # Password should be write-only

    def validate_new_password(self, value):
        # Here we're using Django's built-in validate_password method.
        # This will check the password against the validators defined in the settings.
        validate_password(value, self.context.get('user'))
        return value

