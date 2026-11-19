from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from appointments.models import Appointment

from .models import Notification


@shared_task
def send_reminder_for(appointment_id):
    appt = Appointment.objects.get(pk=appointment_id)
    Notification.objects.create(user=appt.created_by, message=f"Reminder: appointment at {appt.starts_at}")


@shared_task
def send_reminders():
    soon = timezone.now() + timedelta(hours=24)
    for appt in Appointment.objects.filter(status="booked", starts_at__lte=soon):
        send_reminder_for.delay(appt.pk)
