import csv

from django.http import HttpResponse
from rest_framework.views import APIView

from appointments.models import Appointment
from patients.models import Patient


class ExportPatientsView(APIView):
    def get(self, request):
        resp = HttpResponse(content_type="text/csv")
        writer = csv.writer(resp)
        writer.writerow(["id", "name", "ssn", "phone"])
        for p in Patient.objects.all():
            writer.writerow([p.id, p.name, p.ssn, p.phone])
        return resp


class ExportAppointmentsView(APIView):
    def get(self, request):
        resp = HttpResponse(content_type="text/csv")
        writer = csv.writer(resp)
        writer.writerow(["id", "patient_id", "doctor_id", "starts_at", "status"])
        for a in Appointment.objects.all():
            writer.writerow([a.id, a.patient_id, a.doctor_id, a.starts_at, a.status])
        return resp


EXPORT_REGISTRY = {
    "patients": ExportPatientsView,
    "appointments": ExportAppointmentsView,
}
