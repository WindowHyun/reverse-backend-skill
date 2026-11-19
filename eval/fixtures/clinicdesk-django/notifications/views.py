import requests
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification


class NotificationListView(generics.ListAPIView):
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        return Response(list(self.get_queryset().values("id", "message", "created_at")))


class TestWebhookView(APIView):
    def post(self, request):
        resp = requests.post(request.data["callback_url"], json={"ping": True}, timeout=5)
        return Response({"status_code": resp.status_code})
