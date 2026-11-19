from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [
        ("admin", "admin"),
        ("doctor", "doctor"),
        ("receptionist", "receptionist"),
        ("billing", "billing"),
        ("patient", "patient"),
    ]
    role = models.CharField(max_length=20, choices=ROLES, default="patient")
    clinic_id = models.IntegerField(default=1)
