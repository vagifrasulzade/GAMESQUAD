from django.core.files.storage import default_storage
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.permissions import IsAdminOrReadOnly

from .models import Game
from .serializers import GameSerializer


class GameViewSet(viewsets.ModelViewSet):
    serializer_class = GameSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Game.objects.all()
        actor = getattr(self.request, "user", None)
        # The public catalog only shows active titles; staff manage everything.
        if not (actor and actor.is_staff):
            qs = qs.filter(is_active=True)
        return qs

    @action(
        detail=False,
        methods=["post"],
        url_path="upload-image",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request):
        """Staff upload a game logo and get back a hosted URL for the icon field."""
        file = request.FILES.get("image")
        if not file:
            return Response(
                {"image": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        path = default_storage.save(f"game_icons/{file.name}", file)
        url = request.build_absolute_uri(default_storage.url(path))
        return Response({"url": url})
