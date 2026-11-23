from rest_framework import serializers

from .models import MedicalRecord, Patient


class PatientListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ["id", "name", "birth_date", "assigned_doctor"]


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = "__all__"


class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = "__all__"
