from django.db import connection
from rest_framework.response import Response
from rest_framework.views import APIView


class SummaryReportView(APIView):
    # permission_classes = [IsAdminUser]

    def get(self, request):
        clinic = request.GET.get("clinic", "1")
        with connection.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM patients_patient WHERE clinic_id = '{clinic}'")
            rows = cur.fetchall()
        return Response({"rows": rows})
