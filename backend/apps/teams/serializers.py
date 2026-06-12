from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.games.models import Game
from apps.games.serializers import GameSerializer

from .models import Application, Recruitment, Team, TeamMembership


class TeamMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TeamMembership
        fields = ["id", "user", "role", "joined_at"]


class TeamSerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)
    game_id = serializers.PrimaryKeyRelatedField(
        source="game", queryset=Game.objects.all(), write_only=True
    )
    owner = UserSerializer(read_only=True)
    member_count = serializers.ReadOnlyField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "slug",
            "logo",
            "description",
            "region",
            "playstyle",
            "verified",
            "game",
            "game_id",
            "owner",
            "member_count",
            "is_member",
            "created_at",
        ]
        read_only_fields = ["owner", "created_at"]

    def get_is_member(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.memberships.filter(user=user).exists()

    def validate(self, attrs):
        # Only staff may flip the verified flag; everyone else has it ignored.
        request = self.context.get("request")
        if "verified" in attrs and not (request and request.user.is_staff):
            attrs.pop("verified")
        return attrs


class RecruitmentSerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)
    game_id = serializers.PrimaryKeyRelatedField(
        source="game", queryset=Game.objects.all(), write_only=True
    )
    team_id = serializers.PrimaryKeyRelatedField(
        source="team", queryset=Team.objects.all(), write_only=True, required=False, allow_null=True
    )
    created_by = UserSerializer(read_only=True)
    team = TeamSerializer(read_only=True)
    application_count = serializers.ReadOnlyField()
    has_applied = serializers.SerializerMethodField()

    class Meta:
        model = Recruitment
        fields = [
            "id",
            "title",
            "description",
            "game",
            "game_id",
            "team",
            "team_id",
            "created_by",
            "roles_needed",
            "slots",
            "rank_requirement",
            "schedule",
            "type",
            "status",
            "application_count",
            "has_applied",
            "created_at",
        ]
        read_only_fields = ["created_by", "team", "created_at"]

    def get_has_applied(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.applications.filter(applicant=user).exists()


class ApplicationSerializer(serializers.ModelSerializer):
    applicant = UserSerializer(read_only=True)
    recruitment_id = serializers.PrimaryKeyRelatedField(
        source="recruitment", queryset=Recruitment.objects.all(), write_only=True
    )
    recruitment_title = serializers.ReadOnlyField(source="recruitment.title")

    class Meta:
        model = Application
        fields = [
            "id",
            "recruitment_id",
            "recruitment_title",
            "applicant",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = ["applicant", "created_at"]
