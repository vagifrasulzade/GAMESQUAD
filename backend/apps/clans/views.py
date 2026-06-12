from django.core.files.storage import default_storage
from django.utils.text import slugify
from rest_framework import decorators, permissions, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.permissions import IsStaffOrOwnerOrReadOnly

from .models import Clan, ClanMembership
from .serializers import ClanMembershipSerializer, ClanSerializer


class ClanViewSet(viewsets.ModelViewSet):
    queryset = Clan.objects.select_related("owner").prefetch_related("games")
    serializer_class = ClanSerializer
    permission_classes = [IsStaffOrOwnerOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        game = self.request.query_params.get("game")
        region = self.request.query_params.get("region")
        search = self.request.query_params.get("search")
        if game:
            qs = qs.filter(games__slug=game)
        if region:
            qs = qs.filter(region=region)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs.distinct()

    def perform_create(self, serializer):
        clan = serializer.save(
            owner=self.request.user, slug=slugify(serializer.validated_data["name"])
        )
        ClanMembership.objects.create(clan=clan, user=self.request.user, role="owner")

    @decorators.action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        memberships = self.get_object().memberships.select_related("user")
        return Response(ClanMembershipSerializer(memberships, many=True).data)

    @decorators.action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def join(self, request, pk=None):
        clan = self.get_object()
        ClanMembership.objects.get_or_create(clan=clan, user=request.user)
        return Response({"status": "joined"})

    @decorators.action(
        detail=False,
        methods=["post"],
        url_path="upload-logo",
        permission_classes=[permissions.IsAdminUser],
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_logo(self, request):
        file = request.FILES.get("logo")
        if not file:
            return Response(
                {"logo": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        path = default_storage.save(f"clan_logos/{file.name}", file)
        url = request.build_absolute_uri(default_storage.url(path))
        return Response({"logo": url})
