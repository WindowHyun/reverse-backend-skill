from rest_framework.routers import SimpleRouter

from .views_v2 import AppointmentV2ViewSet

router = SimpleRouter()
router.register("", AppointmentV2ViewSet, basename="appointment-v2")

urlpatterns = router.urls
