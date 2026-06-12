from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import ai, service


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def matches(request):
    """Ranked AI matches for the current user. ?type=teams|clans|all"""
    kind = request.query_params.get("type", "all")
    data = service.build_matches(request.user, kind=kind)
    return Response({"ai_enabled": ai.is_configured(), "results": data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assistant(request):
    """Chat with the AI matchmaking assistant."""
    message = request.data.get("message", "")
    history = request.data.get("history", [])
    return Response(service.assistant_reply(request.user, history, message))
