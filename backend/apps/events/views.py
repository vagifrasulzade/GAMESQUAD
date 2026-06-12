from django.utils.text import slugify
from rest_framework import decorators, permissions, viewsets
from rest_framework.response import Response

from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related("host", "game").prefetch_related(
        "participants"
    )
    serializer_class = EventSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        game = self.request.query_params.get("game")
        mode = self.request.query_params.get("mode")
        if game:
            qs = qs.filter(game__slug=game)
        if mode:
            qs = qs.filter(mode=mode)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            host=self.request.user, slug=slugify(serializer.validated_data["title"])
        )

    @decorators.action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def register(self, request, pk=None):
        event = self.get_object()
        event.participants.add(request.user)
        return Response({"status": "registered"})

    @decorators.action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def unregister(self, request, pk=None):
        event = self.get_object()
        event.participants.remove(request.user)
        return Response({"status": "unregistered"})
