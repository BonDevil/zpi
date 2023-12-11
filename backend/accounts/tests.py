from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import AppUser


# models tests


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


User = get_user_model()


class UserViewTests(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        self.client = APIClient()

    def test_user_register(self):
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'newpassword',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # def test_user_login(self):
    #     url = reverse('login')
    #     data = {
    #         'email': 'test@example.com',
    #         'password': 'testpassword',
    #     }
    #     response = self.client.post(url, data, format='json')
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_logout(self):
        url = reverse('logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_view(self):
        url = reverse('user')
        self.client.force_authenticate(user=self.user)  # Authenticate the test user
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

