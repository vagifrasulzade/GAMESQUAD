from django.conf import settings
from django.db import models


class Conversation(models.Model):
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    @property
    def last_message(self):
        return self.messages.order_by("-created_at").first()

    def __str__(self):
        return f"Conversation #{self.pk}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    body = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.body[:30]}"


class Notification(models.Model):
    TYPE = [
        ("invite", "Invite"),
        ("application", "Application"),
        ("message", "Message"),
        ("match", "Match"),
        ("system", "System"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=20, choices=TYPE, default="system")
    title = models.CharField(max_length=140)
    body = models.TextField(blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user}: {self.title}"


class SavedItem(models.Model):
    """A bookmark to a team / clan / recruitment / player."""

    TARGET = [
        ("team", "Team"),
        ("clan", "Clan"),
        ("recruitment", "Recruitment"),
        ("player", "Player"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_items"
    )
    target_type = models.CharField(max_length=20, choices=TARGET)
    target_id = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "target_type", "target_id")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} saved {self.target_type}#{self.target_id}"


class Report(models.Model):
    TYPE = [
        ("user", "User"),
        ("message", "Message"),
        ("recruitment", "Recruitment"),
        ("clan", "Clan"),
    ]
    STATUS = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports"
    )
    type = models.CharField(max_length=20, choices=TYPE, default="user")
    target_label = models.CharField(max_length=140, blank=True)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default="open")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report #{self.pk} ({self.type})"
