from django.core.files.storage import default_storage
from django.utils.text import slugify
from rest_framework import decorators, permissions, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.permissions import IsStaffOrOwnerOrReadOnly
from apps.social.models import Notification

from .models import Application, Recruitment, Team, TeamMembership
from .serializers import (
    ApplicationSerializer,
    RecruitmentSerializer,
    TeamMembershipSerializer,
    TeamSerializer,
)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.select_related("owner", "game")
    serializer_class = TeamSerializer
    permission_classes = [IsStaffOrOwnerOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        game = self.request.query_params.get("game")
        playstyle = self.request.query_params.get("playstyle")
        search = self.request.query_params.get("search")
        if game:
            qs = qs.filter(game__slug=game)
        if playstyle:
            qs = qs.filter(playstyle=playstyle)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        team = serializer.save(
            owner=self.request.user, slug=slugify(serializer.validated_data["name"])
        )
        TeamMembership.objects.create(team=team, user=self.request.user, role="owner")

    @decorators.action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        memberships = self.get_object().memberships.select_related("user")
        return Response(TeamMembershipSerializer(memberships, many=True).data)

    @decorators.action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def join(self, request, pk=None):
        team = self.get_object()
        TeamMembership.objects.get_or_create(team=team, user=request.user)
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
        path = default_storage.save(f"team_logos/{file.name}", file)
        url = request.build_absolute_uri(default_storage.url(path))
        return Response({"logo": url})


class RecruitmentViewSet(viewsets.ModelViewSet):
    queryset = Recruitment.objects.select_related("created_by", "game", "team")
    serializer_class = RecruitmentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        game = self.request.query_params.get("game")
        status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        if game:
            qs = qs.filter(game__slug=game)
        if status:
            qs = qs.filter(status=status)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @decorators.action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def apply(self, request, pk=None):
        recruitment = self.get_object()
        application, created = Application.objects.get_or_create(
            recruitment=recruitment,
            applicant=request.user,
            defaults={"message": request.data.get("message", "")},
        )
        if created:
            Notification.objects.create(
                user=recruitment.created_by,
                type="application",
                title=f"New application from {request.user.display_tag}",
                body=recruitment.title,
            )
        return Response(ApplicationSerializer(application).data, status=201)


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base = Application.objects.select_related("applicant", "recruitment")
        if user.is_staff:
            return base
        # Applications the user sent, plus applications to recruitments they own.
        return base.filter(applicant=user) | base.filter(recruitment__created_by=user)

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

    def perform_update(self, serializer):
        # Only staff can update status
        if not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only staff can update applications")
        serializer.save()
