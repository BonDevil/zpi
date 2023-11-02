# Create your tests here.
from django.test import TestCase
from .models import AppUser


# accounts tests

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import AppUser


class AppUserModelTestCase(TestCase):
    def setUp(self):
        self.user = AppUser.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='testpassword'
        )

    def test_create_user(self):
        self.assertIsInstance(self.user, AppUser)
        self.assertFalse(self.user.is_superuser)
        self.assertFalse(self.user.is_staff)
        self.assertEqual(self.user.email, 'testuser@example.com')
        self.assertEqual(self.user.username, 'testuser')

    def test_create_superuser(self):
        superuser = AppUser.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpassword'
        )
        self.assertIsInstance(superuser, AppUser)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_staff)

    def test_str_method(self):
        self.assertEqual(str(self.user), 'testuser')

    def test_email_required(self):
        with self.assertRaises(ValueError):
            AppUser.objects.create_user(
                email='',
                username='testuser3',
                password='testpassword3'
            )

    def test_user_manager_create_user(self):
        user = AppUser.objects.create_user(
            email='user@example.com',
            username='user',
            password='password'
        )
        self.assertIsInstance(user, AppUser)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)

    def test_user_manager_create_superuser(self):
        superuser = AppUser.objects.create_superuser(
            email='admin2@example.com',
            username='admin2',
            password='admin2password'
        )
        self.assertIsInstance(superuser, AppUser)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_staff)

# views tests

    class UserRegisterAPIViewTestCase(APITestCase):
        def test_user_registration(self):
            data = {
                "email": "test@example.com",
                "username": "testuser",
                "password": "testpassword"
            }
            response = self.client.post(reverse("register"), data, format="json")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    class UserLoginAPIViewTestCase(APITestCase):
        def setUp(self):
            self.user = AppUser.objects.create_user(
                email="test@example.com",
                username="testuser",
                password="testpassword"
            )

        def test_user_login(self):
            data = {
                "email": "test@example.com",
                "password": "testpassword"
            }
            response = self.client.post(reverse("login"), data, format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        def test_user_login_invalid_credentials(self):
            data = {
                "email": "test@example.com",
                "password": "wrongpassword"
            }
            response = self.client.post(reverse("login"), data, format="json")
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    class UserLogoutAPIViewTestCase(APITestCase):
        def test_user_logout(self):
            response = self.client.post(reverse("logout"), format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    class UserViewAPIViewTestCase(APITestCase):
        def setUp(self):
            self.user = AppUser.objects.create_user(
                email="test@example.com",
                username="testuser",
                password="testpassword"
            )
            self.token = Token.objects.create(user=self.user)
            self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        def test_get_user(self):
            response = self.client.get(reverse("user"), format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    class UserEditAPIViewTestCase(APITestCase):
        def setUp(self):
            self.user = AppUser.objects.create_user(
                email="test@example.com",
                username="testuser",
                password="testpassword"
            )
            self.token = Token.objects.create(user=self.user)
            self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        def test_edit_user(self):
            data = {
                "email": "newemail@example.com",
                "username": "newusername",
            }
            response = self.client.put(reverse("edit"), data, format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    class ChangePasswordViewAPIViewTestCase(APITestCase):
        def setUp(self):
            self.user = AppUser.objects.create_user(
                email="test@example.com",
                username="testuser",
                password="testpassword"
            )
            self.token = Token.objects.create(user=self.user)
            self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        def test_change_password(self):
            data = {
                "old_password": "testpassword",
                "new_password": "newpassword",
            }
            response = self.client.post(reverse("password_change"), data, format="json")
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

