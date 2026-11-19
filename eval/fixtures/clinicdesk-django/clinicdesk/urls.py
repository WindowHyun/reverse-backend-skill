from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from core.views import health
from exports.views import EXPORT_REGISTRY

urlpatterns = [
    path("healthz/", health),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/patients/", include("patients.urls")),
    path("api/v1/appointments/", include("appointments.urls_v1")),
    path("api/v2/appointments/", include("appointments.urls_v2")),
    path("api/v1/billing/", include("billing.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/reports/", include("reports.urls")),
]

for _name, _view in EXPORT_REGISTRY.items():
    urlpatterns.append(path(f"api/v1/export/{_name}/", _view.as_view()))
