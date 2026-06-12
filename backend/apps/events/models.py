from django.conf import settings
from django.db import models


class Event(models.Model):
    """A tournament, scrim or community event players can register for."""

    MODE = [
        ("tournament", "Tournament"),
        ("scrim", "Scrim"),
        ("community", "Community"),
    ]

    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    banner = models.URLField(blank=True)

    game = models.ForeignKey(
        "games.Game",
        on_delete=models.SET_NULL,
        related_name="events",
        null=True,
        blank=True,
    )
    mode = models.CharField(max_length=20, choices=MODE, default="tournament")
    format = models.CharField(max_length=40, blank=True)  # e.g. "5v5", "Battle Royale"
    region = models.CharField(max_length=40, blank=True)
    prize = models.CharField(max_length=80, blank=True)
    starts_at = models.DateTimeField()
    max_teams = models.PositiveSmallIntegerField(default=16)

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_events",
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="events",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["starts_at"]

    @property
    def participant_count(self):
        return self.participants.count()

    def __str__(self):
        return self.title
