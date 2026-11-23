from decimal import Decimal

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsBillingStaff

from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsBillingStaff]

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        invoice = self.get_object()
        if Decimal(request.data["amount"]) != invoice.total:
            return Response({"detail": "amount mismatch"}, status=400)
        invoice.status = "paid"
        invoice.save()
        return Response({"status": "paid"})

    @action(detail=True, methods=["post"], url_path="apply-discount")
    def apply_discount(self, request, pk=None):
        invoice = self.get_object()
        percent = Decimal(request.data["percent"])
        invoice.total = invoice.total * (100 - percent) / 100
        invoice.discount_percent = percent
        invoice.save()
        return Response(InvoiceSerializer(invoice).data)


class PaymentWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        signature = request.headers.get("X-Signature")  # TODO: verify against the gateway secret
        invoice = Invoice.objects.get(pk=request.data["invoice_id"])
        invoice.status = "paid"
        invoice.save()
        return Response({"ok": True})
