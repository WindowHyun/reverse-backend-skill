from django.db import models

from patients.models import Patient


class Invoice(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default="open")
