from django.urls import path

from .views import SummaryReportView

urlpatterns = [path("summary/", SummaryReportView.as_view())]
