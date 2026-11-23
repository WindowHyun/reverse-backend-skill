from django.db.models.signals import post_save
from django.dispatch import receiver

from appointments.models import Appointment

from .tasks import send_reminder_for


@receiver(post_save, sender=Appointment)
def enqueue_reminder(sender, instance, created, **kwargs):
    if created:
        send_reminder_for.delay(instance.pk)
