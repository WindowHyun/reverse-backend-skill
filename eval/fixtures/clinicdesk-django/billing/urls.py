from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import InvoiceViewSet, PaymentWebhookView

router = SimpleRouter()
router.register("invoices", InvoiceViewSet, basename="invoice")

urlpatterns = [
    path("webhook/payment/", PaymentWebhookView.as_view()),
    path("", include(router.urls)),
]
