from django.conf import settings
from django.db import models


class Patient(models.Model):
    clinic_id = models.IntegerField()
    name = models.CharField(max_length=100)
    birth_date = models.DateField(null=True)
    ssn = models.CharField(max_length=20)
    phone = models.CharField(max_length=30, blank=True)
    assigned_doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="patients"
    )


class MedicalRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    note = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
