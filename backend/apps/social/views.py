from rest_framework import decorators, mixins, permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Conversation, Message, Notification, Report, SavedItem
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    NotificationSerializer,
    ReportSerializer,
    SavedItemSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.filter(participants=self.request.user)
            .prefetch_related("participants", "messages")
            .distinct()
        )

    def perform_create(self, serializer):
        conversation = serializer.save()
        conversation.participants.add(self.request.user)
        for uid in self.request.data.get("participant_ids", []):
            conversation.participants.add(uid)

    @decorators.action(detail=False, methods=["post"])
    def start(self, request):
        """Find-or-create a 1:1 conversation with another user by id."""
        other_id = request.data.get("user_id")
        if not other_id:
            return Response({"user_id": "This field is required."}, status=400)
        wanted = {request.user.id, int(other_id)}
        for conv in Conversation.objects.filter(
            participants=request.user
        ).prefetch_related("participants"):
            if set(conv.participants.values_list("id", flat=True)) == wanted:
                return Response(self.get_serializer(conv).data)
        conv = Conversation.objects.create()
        conv.participants.add(request.user.id, int(other_id))
        return Response(self.get_serializer(conv).data, status=201)

    @decorators.action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        if request.method.lower() == "post":
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                body=request.data.get("body", ""),
            )
            return Response(MessageSerializer(message).data, status=201)
        qs = conversation.messages.select_related("sender")
        return Response(MessageSerializer(qs, many=True).data)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @decorators.action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().update(read=True)
        return Response({"status": "ok"})

    @decorators.action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.read = True
        notification.save(update_fields=["read"])
        return Response({"status": "ok"})


class SavedItemViewSet(viewsets.ModelViewSet):
    serializer_class = SavedItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Report.objects.select_related("reporter")
        if self.request.user.is_staff:
            return qs
        return qs.filter(reporter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @decorators.action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser]
    )
    def set_status(self, request, pk=None):
        report = self.get_object()
        status = request.data.get("status")
        valid = {choice[0] for choice in Report.STATUS}
        if status not in valid:
            return Response({"error": "invalid status"}, status=400)
        report.status = status
        report.save(update_fields=["status"])
        return Response(ReportSerializer(report).data)


class MessageViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Flat message list. Staff see all messages; others see only their own.
    A message can be deleted by staff or by its own sender."""

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Message.objects.select_related("sender").order_by("-created_at")
        if self.request.user.is_staff:
            return qs
        return qs.filter(conversation__participants=self.request.user).distinct()

    def perform_destroy(self, instance):
        user = self.request.user
        if not (user.is_staff or instance.sender_id == user.id):
            raise PermissionDenied("You can only delete your own messages.")
        instance.delete()
