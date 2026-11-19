import pytest
from django.test import Client

from accounts.models import User


@pytest.mark.django_db
def test_register_creates_user():
    resp = Client().post(
        "/api/v1/auth/register/",
        {"email": "a@example.com", "username": "a", "password": "pw12345"},
        content_type="application/json",
    )
    assert resp.status_code == 201
    assert User.objects.filter(username="a").exists()
