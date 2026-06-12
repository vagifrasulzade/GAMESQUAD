from django.conf import settings
from django.db import models


class Clan(models.Model):
    FOCUS = [("competitive", "Competitive"), ("casual", "Casual"), ("mixed", "Mixed")]

    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=90, unique=True)
    logo = models.URLField(blank=True)
    description = models.TextField(blank=True)
    region = models.CharField(max_length=40, blank=True)
    focus = models.CharField(max_length=20, choices=FOCUS, default="mixed")
    verified = models.BooleanField(default=False)

    games = models.ManyToManyField("games.Game", related_name="clans", blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_clans"
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ClanMembership",
        related_name="clans",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def member_count(self):
        return self.memberships.count()

    def __str__(self):
        return self.name


class ClanMembership(models.Model):
    ROLE = [("owner", "Owner"), ("admin", "Admin"), ("member", "Member")]

    clan = models.ForeignKey(
        Clan, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="clan_memberships"
    )
    role = models.CharField(max_length=20, choices=ROLE, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("clan", "user")

    def __str__(self):
        return f"{self.user} @ {self.clan} ({self.role})"
