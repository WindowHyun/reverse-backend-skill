from rest_framework.response import Response
from rest_framework.views import exception_handler


def problem_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None
    detail = response.data.get("detail") if isinstance(response.data, dict) else response.data
    return Response(
        {
            "type": "about:blank",
            "title": getattr(exc, "default_detail", "Error"),
            "status": response.status_code,
            "detail": detail,
        },
        status=response.status_code,
    )
