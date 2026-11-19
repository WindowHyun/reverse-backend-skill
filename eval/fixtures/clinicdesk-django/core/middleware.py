import logging

logger = logging.getLogger("clinicdesk.request")


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in ("POST", "PUT", "PATCH"):
            logger.info("%s %s body=%s", request.method, request.path, request.body.decode("utf-8", "ignore"))
        return self.get_response(request)


class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.clinic_id = int(request.headers.get("X-Clinic-Id", 0) or 0)
        return self.get_response(request)
