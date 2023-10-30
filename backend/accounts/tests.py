from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model


class UserRegisterTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword"
        }

    def test_user_register(self):
        response = self.client.post(reverse("register"), self.user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class UserLoginTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        self.login_data = {
            "username": "testuser",
            "password": "testpassword",
        }

    def test_user_login(self):
        response = self.client.post(reverse("login"), self.login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserLogoutTestCase(TestCase):
    def test_user_logout(self):
        client = APIClient()
        response = client.post(reverse("logout"), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        self.client.login(username="testuser", password="testpassword")

    def test_user_view(self):
        response = self.client.get(reverse("user"), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
