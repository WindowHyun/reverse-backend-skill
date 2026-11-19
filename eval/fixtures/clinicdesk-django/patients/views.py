import os

from django.conf import settings
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminRole

from .models import Patient
from .serializers import MedicalRecordSerializer, PatientListSerializer, PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == "doctor":
            return Patient.objects.filter(assigned_doctor=user)
        return Patient.objects.filter(clinic_id=self.request.clinic_id)

    def get_serializer_class(self):
        return PatientListSerializer if self.action == "list" else PatientSerializer

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdminRole()]
        return super().get_permissions()

    @action(detail=True, methods=["get"])
    def records(self, request, pk=None):
        patient = Patient.objects.get(pk=pk)
        return Response(MedicalRecordSerializer(patient.medicalrecord_set.all(), many=True).data)


class RecordAttachmentView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, pk):
        upload = request.FILES["file"]
        name = request.data.get("filename", upload.name)
        dest = os.path.join(settings.MEDIA_ROOT, "attachments", str(pk), name)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as out:
            for chunk in upload.chunks():
                out.write(chunk)
        return Response({"path": dest}, status=201)
