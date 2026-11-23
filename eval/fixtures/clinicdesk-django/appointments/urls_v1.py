from rest_framework.routers import SimpleRouter

from .views_v1 import AppointmentViewSet

router = SimpleRouter()
router.register("", AppointmentViewSet, basename="appointment-v1")

urlpatterns = router.urls
