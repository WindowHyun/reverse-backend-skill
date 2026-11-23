from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentV2ViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.all()
        if user.role == "admin":
            return qs
        if user.role == "doctor":
            return qs.filter(doctor=user)
        return qs.filter(created_by=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        appt = self.get_object()
        appt.status = "cancelled"
        appt.save()
        return Response({"status": "cancelled"})
