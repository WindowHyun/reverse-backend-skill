from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    """Deprecated: use /api/v2/appointments/ instead."""

    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        appt = self.get_object()
        appt.status = "cancelled"
        appt.save()
        return Response({"status": "cancelled"})
