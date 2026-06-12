from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.games.models import Game
from apps.games.serializers import GameSerializer

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)
    game_id = serializers.PrimaryKeyRelatedField(
        source="game", queryset=Game.objects.all(), write_only=True, required=False
    )
    host = UserSerializer(read_only=True)
    participant_count = serializers.ReadOnlyField()
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "banner",
            "game",
            "game_id",
            "mode",
            "format",
            "region",
            "prize",
            "starts_at",
            "max_teams",
            "host",
            "participant_count",
            "is_registered",
            "created_at",
        ]
        read_only_fields = ["host", "created_at"]

    def get_is_registered(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.participants.filter(pk=request.user.pk).exists()
