"""Staff-only endpoints powering the React admin panel."""

from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.clans.models import Clan
from apps.social.models import Message, Report
from apps.teams.models import Application, Recruitment, Team

from .models import AppSetting
from .serializers import AppSettingSerializer

User = get_user_model()


class AdminSettingsView(APIView):
    """Read and update the persistent platform settings singleton."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(AppSettingSerializer(AppSetting.load()).data)

    def patch(self, request):
        serializer = AppSettingSerializer(
            AppSetting.load(), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

ACTION_LABELS = {1: "Created", 2: "Updated", 3: "Deleted"}


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(
            {
                "total_users": User.objects.count(),
                "online_users": User.objects.filter(is_online=True).count(),
                "clans": Clan.objects.count(),
                "teams": Team.objects.count(),
                "recruitments": Recruitment.objects.count(),
                "open_recruitments": Recruitment.objects.filter(status="open").count(),
                "applications": Application.objects.count(),
                "messages": Message.objects.count(),
                "reports": Report.objects.count(),
                "open_reports": Report.objects.exclude(status="resolved").count(),
            }
        )


class AuditLogView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        entries = (
            LogEntry.objects.select_related("user", "content_type").order_by("-action_time")[:50]
        )
        data = [
            {
                "id": e.id,
                "user": e.user.get_username() if e.user else "system",
                "action": ACTION_LABELS.get(e.action_flag, "Action"),
                "object": e.object_repr,
                "model": e.content_type.model if e.content_type else "",
                "message": e.get_change_message() or "—",
                "time": e.action_time,
            }
            for e in entries
        ]
        return Response({"results": data})
