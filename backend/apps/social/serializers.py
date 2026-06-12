from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Conversation, Message, Notification, Report, SavedItem


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "body", "read", "created_at"]
        read_only_fields = ["sender", "read", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "participants", "last_message", "created_at", "updated_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "type", "title", "body", "read", "created_at"]
        read_only_fields = fields


class SavedItemSerializer(serializers.ModelSerializer):
    target = serializers.SerializerMethodField()

    class Meta:
        model = SavedItem
        fields = ["id", "target_type", "target_id", "target", "created_at"]
        read_only_fields = ["created_at"]

    def get_target(self, obj):
        """Resolve the bookmarked object into a small card-friendly summary."""
        from apps.clans.models import Clan
        from apps.games.serializers import GameSerializer
        from apps.teams.models import Recruitment, Team

        try:
            if obj.target_type == "team":
                t = Team.objects.select_related("game").get(pk=obj.target_id)
                return {
                    "name": t.name,
                    "logo": t.logo,
                    "subtitle": t.game.name,
                    "games": [GameSerializer(t.game).data],
                }
            if obj.target_type == "clan":
                c = Clan.objects.prefetch_related("games").get(pk=obj.target_id)
                return {
                    "name": c.name,
                    "logo": c.logo,
                    "subtitle": c.get_focus_display(),
                    "games": GameSerializer(c.games.all(), many=True).data,
                }
            if obj.target_type == "recruitment":
                r = Recruitment.objects.select_related("game").get(pk=obj.target_id)
                return {
                    "name": r.title,
                    "logo": "",
                    "subtitle": r.game.name,
                    "games": [GameSerializer(r.game).data],
                }
        except (Team.DoesNotExist, Clan.DoesNotExist, Recruitment.DoesNotExist):
            return None
        return None


class ReportSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)

    class Meta:
        model = Report
        fields = ["id", "reporter", "type", "target_label", "reason", "status", "created_at"]
        read_only_fields = ["reporter", "status", "created_at"]
