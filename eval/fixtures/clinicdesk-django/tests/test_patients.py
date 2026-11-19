import pytest
from django.test import Client


@pytest.mark.django_db
def test_patient_list_requires_auth():
    assert Client().get("/api/v1/patients/").status_code == 401
