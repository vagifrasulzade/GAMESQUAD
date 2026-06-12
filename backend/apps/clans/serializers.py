from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.games.models import Game
from apps.games.serializers import GameSerializer

from .models import Clan, ClanMembership


class ClanMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ClanMembership
        fields = ["id", "user", "role", "joined_at"]


class ClanSerializer(serializers.ModelSerializer):
    games = GameSerializer(many=True, read_only=True)
    game_ids = serializers.PrimaryKeyRelatedField(
        source="games", queryset=Game.objects.all(), many=True, write_only=True,
        required=False,
    )
    owner = UserSerializer(read_only=True)
    member_count = serializers.ReadOnlyField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Clan
        fields = [
            "id",
            "name",
            "slug",
            "logo",
            "description",
            "region",
            "focus",
            "verified",
            "games",
            "game_ids",
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
        request = self.context.get("request")
        if "verified" in attrs and not (request and request.user.is_staff):
            attrs.pop("verified")
        return attrs
