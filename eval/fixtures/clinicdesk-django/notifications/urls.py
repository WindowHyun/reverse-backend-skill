from django.urls import path

from .views import NotificationListView, TestWebhookView

urlpatterns = [
    path("", NotificationListView.as_view()),
    path("test-webhook/", TestWebhookView.as_view()),
]
