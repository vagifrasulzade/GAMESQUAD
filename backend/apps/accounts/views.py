from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.db.models import Q, Value
from django.db.models.functions import Concat
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import GameAccount
from .serializers import (
    AdminUserSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
    GameAccountSerializer,
    ProfileSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class GameAccountViewSet(viewsets.ModelViewSet):
    """A signed-in user manages the games on their own profile."""

    serializer_class = GameAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GameAccount.objects.filter(user=self.request.user).select_related("game")

    def perform_create(self, serializer):
        game = serializer.validated_data["game"]
        if GameAccount.objects.filter(user=self.request.user, game=game).exists():
            raise ValidationError({"game_id": "This game is already on your profile."})
        serializer.save(user=self.request.user)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        from .models import AppSetting

        if not AppSetting.load().allow_registration:
            return Response(
                {"detail": "Registration is currently disabled by the administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().prefetch_related("game_accounts__game")
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            # Match username, tag, and first/last/full name so a search hits
            # both the handle and the person's real name. The annotation is named
            # `search_full_name` to avoid clashing with the read-only `full_name`
            # model property (which has no setter Django could assign to).
            qs = qs.annotate(
                search_full_name=Concat("first_name", Value(" "), "last_name")
            ).filter(
                Q(username__icontains=search)
                | Q(tag__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(search_full_name__icontains=search)
            )
        if self.request.query_params.get("exclude_self") and self.request.user.is_authenticated:
            qs = qs.exclude(pk=self.request.user.pk)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        # Creating, editing or deleting *other* user records is staff-only.
        # Self-service edits go through the `me` action below.
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        actor = getattr(self.request, "user", None)
        if actor and actor.is_staff and self.action in (
            "create",
            "update",
            "partial_update",
        ):
            return AdminUserSerializer
        return UserSerializer

    @action(detail=False, methods=["get", "patch", "delete"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        if request.method.lower() == "patch":
            serializer = ProfileSerializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        if request.method.lower() == "delete":
            serializer = DeleteAccountSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(ProfileSerializer(request.user).data)

    @action(
        detail=False,
        methods=["post"],
        url_path="me/password",
        permission_classes=[permissions.IsAuthenticated],
    )
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated successfully."})

    @action(
        detail=False,
        methods=["post"],
        url_path="me/avatar",
        permission_classes=[permissions.IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_avatar(self, request):
        file = request.FILES.get("avatar")
        if not file:
            return Response(
                {"avatar": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        path = default_storage.save(f"avatars/user_{request.user.id}/{file.name}", file)
        url = request.build_absolute_uri(default_storage.url(path))
        request.user.avatar = url
        request.user.save(update_fields=["avatar"])
        return Response({"avatar": url})

    @action(
        detail=False,
        methods=["post"],
        url_path="upload-avatar",
        permission_classes=[permissions.IsAdminUser],
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_admin_avatar(self, request):
        file = request.FILES.get("avatar")
        if not file:
            return Response(
                {"avatar": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        path = default_storage.save(f"avatars/{file.name}", file)
        url = request.build_absolute_uri(default_storage.url(path))
        return Response({"avatar": url})
