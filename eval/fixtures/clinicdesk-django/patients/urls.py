from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import PatientViewSet, RecordAttachmentView

router = SimpleRouter()
router.register("", PatientViewSet, basename="patient")

urlpatterns = [
    path("<int:pk>/attachments/", RecordAttachmentView.as_view()),
    *router.urls,
]
