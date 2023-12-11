import logging
import uuid

# Django imports for authentication, session management, and hashing
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.hashers import make_password
from django.utils.crypto import get_random_string
from smtplib import SMTPException

# Swagger documentation utility
from drf_yasg.utils import swagger_auto_schema

# REST framework imports for permissions, status codes, and session authentication
from rest_framework import permissions, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

# Imports from local modules for permissions, mailing system, models, tasks, and serializers
from events import my_permissions
from events.mailing_system import send_notification
from events.models import EventRegistration
from events.tasks import send_verification_email
from .models import AppUser
from .serializers import (
    UserRegisterSerializer, UserLoginSerializer, UserSerializer, PasswordChangeSerializer,
    ResetPasswordSerializer, VerificationSerializer
)

# Setting up a logger for this module
logger = logging.getLogger(__name__)


class UserRegister(APIView):
    """
    API view for registering a new user.
    """
    # Allow any user to access this view
    permission_classes = [permissions.AllowAny]
    # Use session authentication
    authentication_classes = [SessionAuthentication]

    # Auto-generate Swagger documentation for this view
    @swagger_auto_schema(
        operation_summary="Register a new user",
        operation_description="Create a new user account with email, username, and password.",
        request_body=UserRegisterSerializer,
        responses={
            status.HTTP_201_CREATED: UserRegisterSerializer,
            status.HTTP_400_BAD_REQUEST: "Invalid input"
        },
        tags=['User Authentication']
    )
    def post(self, request):
        # Deserialize and validate the incoming data
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            # Create a user instance from the validated data
            user = AppUser(**serializer.validated_data)

            # Generate a unique verification code
            verification_code = str(uuid.uuid4())
            user.verification_code = verification_code

            # Try sending a verification email
            try:
                send_verification_email(user.email, verification_code, user_id=user.user_id)
                # Save the user to the database only after successful email sending
                user.save()

                # Prepare the response data
                response_data = serializer.data
                response_data['id'] = user.id
                return Response(response_data, status=status.HTTP_201_CREATED)
            except SMTPException:
                # Handle SMTP errors
                return Response({"error": "SMTP Server is not available"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # If data is invalid, return an error response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLogin(APIView):
    """
    API view for user login.
    """
    # Permissions and authentication classes for the view
    permission_classes = [permissions.AllowAny]
    authentication_classes = [SessionAuthentication]

    # Swagger schema for documentation
    @swagger_auto_schema(
        operation_description="Login a user.",
        request_body=UserLoginSerializer,
        responses={
            status.HTTP_200_OK: '{"id": "User ID", "email": "User Email", "username": "Username"}',
            status.HTTP_400_BAD_REQUEST: 'Bad Request',
        },
        tags=['User Authentication'],
    )
    def post(self, request):
        # Deserialize and validate incoming data
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.validated_data
            # Log the user in
            login(request, user)
            # Respond with user details
            return Response({'id': user.user_id, 'email': user.email, 'username': user.username},
                            status=status.HTTP_200_OK)

class UserLogout(APIView):
    """
    API view for user logout.
    """
    permission_classes = (permissions.AllowAny,)
    authentication_classes = [SessionAuthentication]

    @swagger_auto_schema(
        operation_description="Logout a user.",
        responses={status.HTTP_200_OK: 'Successfully logged out.'},
        tags=['User Authentication'],
    )
    def post(self, request):
        # Log the user out
        logout(request)
        return Response(status=status.HTTP_200_OK)

class UserView(APIView):
    """
    API view to retrieve current user information.
    """
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    @swagger_auto_schema(
        operation_description="Get the current user's details.",
        responses={
            status.HTTP_200_OK: UserSerializer,
            status.HTTP_403_FORBIDDEN: 'Forbidden',
        },
        tags=['User Profile'],
    )
    def get(self, request):
        # Serialize the user data
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserEdit(APIView):
    """
    API view to update user information.
    """
    permission_classes = [permissions.IsAuthenticated, my_permissions.IsOwnerOrReadOnlyOrSuperuser]
    authentication_classes = [SessionAuthentication]

    @swagger_auto_schema(
        operation_description="Update current user's details.",
        request_body=UserSerializer,
        responses={
            status.HTTP_200_OK: UserSerializer,
            status.HTTP_400_BAD_REQUEST: 'Bad Request',
        },
        tags=['User Profile'],
    )
    def put(self, request):
        # Deserialize and validate incoming data, then save it
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'user': serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    """
    API view to change user password.
    """
    permission_classes = (permissions.IsAuthenticated, my_permissions.IsOwnerOrReadOnlyOrSuperuser)
    authentication_classes = [SessionAuthentication]

    @swagger_auto_schema(
        operation_description="Change password for the current user.",
        request_body=PasswordChangeSerializer,
        responses={
            status.HTTP_204_NO_CONTENT: 'Password changed successfully.',
            status.HTTP_400_BAD_REQUEST: 'Bad Request',
        },
        tags=['User Profile'],
    )
    def post(self, request, *args, **kwargs):
        # Deserialize and validate incoming data
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            if not request.user.check_password(serializer.data.get('old_password')):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            request.user.set_password(serializer.data.get('new_password'))
            request.user.save()
            update_session_auth_hash(request, request.user)  # Prevent logout after password change
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteAccount(APIView):
    """
    API view for deleting a user account.
    """
    # Permissions and authentication classes for the view
    permission_classes = [permissions.IsAuthenticated, my_permissions.IsOwnerOrReadOnlyOrSuperuser]
    authentication_classes = [SessionAuthentication]

    # Swagger schema for documentation
    @swagger_auto_schema(
        operation_description="Delete the current user's account.",
        responses={
            status.HTTP_204_NO_CONTENT: 'Account deleted successfully.',
            status.HTTP_400_BAD_REQUEST: 'Bad Request',
            status.HTTP_403_FORBIDDEN: 'Forbidden',
        },
        tags=['User Profile'],
    )
    def post(self, request):
        # Retrieve the authenticated user
        user = request.user
        password = request.data.get('password')

        # Validate that the password is provided
        if not password:
            return Response({"detail": "Password is required to delete account."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate the password
        if not user.check_password(password):
            return Response({"detail": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the user has permission to delete the account
        if request.user == user or request.user.is_superuser:
            # Update related records and deactivate the user
            EventRegistration.objects.filter(user=user).update(is_registered=False)
            user.is_active = False
            user.save()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Handle case where user does not have permission
        return Response({"detail": "You do not have permission to delete this account."},
                        status=status.HTTP_403_FORBIDDEN)


class VerifyUserEmail(APIView):
    """
    API view for verifying a user's email.
    """
    # Allow any user to access this view
    permission_classes = [permissions.AllowAny]
    authentication_classes = [SessionAuthentication]

    def get(self, request, *args, **kwargs):
        # Retrieve verification code and user ID from query parameters
        verification_code = request.query_params.get('code')
        user_id = request.query_params.get('user_id')

        # Validate presence of verification code and user ID
        if not verification_code or not user_id:
            return Response({"detail": "Missing verification code or user ID."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Retrieve the user with given verification code and user ID
            user = AppUser.objects.get(
                verification_code=verification_code,
                user_id=user_id,
                is_active=False
            )
        except AppUser.DoesNotExist:
            # Handle user not found or already active
            return Response({"detail": "Invalid verification code or user ID, or already active."},
                            status=status.HTTP_404_NOT_FOUND)

        # Activate the user and save the changes
        user.is_active = True
        user.save()

        return Response({"message": "Email verified successfully. Your account is now active."},
                        status=status.HTTP_200_OK)


class ResetPassword(APIView):
    """
    API view for resetting a user's password.
    """
    # Allow any user to access this view
    permission_classes = [permissions.AllowAny]
    authentication_classes = [SessionAuthentication]

    def post(self, request, *args, **kwargs):
        # Deserialize and validate incoming data
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            email = serializer.validated_data['email']
            try:
                # Retrieve the user by email
                user = AppUser.objects.get(email=email)

                # Generate a random verification code
                password_change_code = get_random_string(length=6, allowed_chars='0123456789')
                user.password_change_code = password_change_code
                user.save()

                # Send an email notification with the verification code
                send_notification(
                    emails=[email],
                    subject="Password Reset Verification Code",
                    content=f"Your verification code is: {password_change_code}"
                )

                return Response({"message": "Verification code sent to your email"}, status=status.HTTP_200_OK)

            except AppUser.DoesNotExist:
                # Handle user not found
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class VerifyAndUpdatePassword(APIView):
    """
    API view for verifying a password change request and updating the password.
    """
    # Allow any user to access this view
    permission_classes = [permissions.AllowAny]
    authentication_classes = [SessionAuthentication]

    def post(self, request, *args, **kwargs):
        # Deserialize and validate incoming data
        serializer = VerificationSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            # Extract data from the validated serializer
            password_change_code = serializer.validated_data['password_change_code']
            new_password = serializer.validated_data['new_password']
            email = serializer.validated_data['email']

            # Retrieve the user by email and password change code
            user = AppUser.objects.filter(email=email, password_change_code=password_change_code).first()

            if user:
                # Update the user's password and clear the verification code
                user.password = make_password(new_password)
                user.password_change_code = None
                user.save()

                return Response({"message": "Password has been reset successfully"}, status=status.HTTP_200_OK)
            else:
                # Handle invalid verification code
                return Response({"error": "essa"}, status=status.HTTP_400_BAD_REQUEST)

