from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.games.models import Game
from apps.games.serializers import GameSerializer

from .models import AppSetting, GameAccount

User = get_user_model()


class AppSettingSerializer(serializers.ModelSerializer):
    # Whether any AI provider key is present in the environment (read-only).
    ai_keys_configured = serializers.SerializerMethodField()

    class Meta:
        model = AppSetting
        fields = [
            "site_name",
            "allow_registration",
            "ai_enabled",
            "groq_model",
            "openrouter_model",
            "ai_keys_configured",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def get_ai_keys_configured(self, obj):
        from django.conf import settings

        return bool(settings.GROQ_API_KEY or settings.OPENROUTER_API_KEY)


class GameAccountSerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)
    game_id = serializers.PrimaryKeyRelatedField(
        source="game", queryset=Game.objects.all(), write_only=True
    )

    class Meta:
        model = GameAccount
        fields = ["id", "game", "game_id", "in_game_name", "rank", "role"]


class UserSerializer(serializers.ModelSerializer):
    display_tag = serializers.ReadOnlyField()
    full_name = serializers.SerializerMethodField()
    game_accounts = GameAccountSerializer(many=True, read_only=True)
    password = serializers.CharField(
        write_only=True, required=False, min_length=6, allow_blank=True
    )

    def get_full_name(self, obj):
        return obj.get_full_name()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "tag",
            "display_tag",
            "full_name",
            "email",
            "avatar",
            "bio",
            "country",
            "region",
            "languages",
            "is_online",
            "status",
            "verified",
            "is_staff",
            "is_superuser",
            "playstyle",
            "looking_for",
            "main_roles",
            "availability_days",
            "availability_from",
            "availability_to",
            "wins",
            "kd",
            "matches",
            "game_accounts",
            "password",
        ]
        read_only_fields = ["id", "verified", "is_online", "is_staff", "is_superuser"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        return user


class ProfileSerializer(serializers.ModelSerializer):
    display_tag = serializers.ReadOnlyField()
    full_name = serializers.CharField(required=False, allow_blank=True)
    game_accounts = GameAccountSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "tag",
            "display_tag",
            "full_name",
            "email",
            "avatar",
            "bio",
            "country",
            "region",
            "languages",
            "is_online",
            "status",
            "verified",
            "is_staff",
            "is_superuser",
            "playstyle",
            "looking_for",
            "main_roles",
            "availability_days",
            "availability_from",
            "availability_to",
            "wins",
            "kd",
            "matches",
            "game_accounts",
        ]
        read_only_fields = ["id", "verified", "is_online", "is_staff", "is_superuser"]

    def update(self, instance, validated_data):
        # `full_name` is a read-only model property, so split it into the
        # underlying first/last name fields before the usual update runs.
        full_name = validated_data.pop("full_name", None)
        if full_name is not None:
            parts = full_name.strip().split(None, 1)
            instance.first_name = parts[0] if parts else ""
            instance.last_name = parts[1] if len(parts) > 1 else ""
        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class DeleteAccountSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.delete()


class AdminUserSerializer(UserSerializer):
    """Used when a staff member edits users via the admin panel; unlocks the
    verification and staff flags that regular users may not set on themselves."""

    class Meta(UserSerializer.Meta):
        read_only_fields = ["id", "is_online", "is_superuser"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "username", "tag", "email", "password", "full_name"]

    def validate_username(self, value):
        """Check if username is already taken."""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        full_name = validated_data.pop("full_name", "")
        # Extract tag if provided, otherwise generate a random 4-digit discriminator
        tag = validated_data.get("tag")
        if not tag:
            import random

            generated = str(random.randint(0, 9999)).zfill(4)
            validated_data["tag"] = generated

        # Split full_name into first_name / last_name when present
        if full_name:
            parts = full_name.strip().split(None, 1)
            validated_data["first_name"] = parts[0]
            if len(parts) > 1:
                validated_data["last_name"] = parts[1]

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
