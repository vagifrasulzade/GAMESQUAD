from django.conf import settings
from django.db import models


class Team(models.Model):
    PLAYSTYLE = [("competitive", "Competitive"), ("casual", "Casual")]

    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=90, unique=True)
    logo = models.URLField(blank=True)
    description = models.TextField(blank=True)
    region = models.CharField(max_length=40, blank=True)
    playstyle = models.CharField(max_length=20, choices=PLAYSTYLE, default="competitive")
    verified = models.BooleanField(default=False)

    game = models.ForeignKey(
        "games.Game", on_delete=models.CASCADE, related_name="teams"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_teams"
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="TeamMembership",
        related_name="teams",
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


class TeamMembership(models.Model):
    ROLE = [("owner", "Owner"), ("captain", "Captain"), ("member", "Member")]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_memberships"
    )
    role = models.CharField(max_length=20, choices=ROLE, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "user")

    def __str__(self):
        return f"{self.user} @ {self.team} ({self.role})"


class Recruitment(models.Model):
    TYPE = [("competitive", "Competitive"), ("casual", "Casual")]
    STATUS = [("open", "Open"), ("closed", "Closed")]

    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    game = models.ForeignKey(
        "games.Game", on_delete=models.CASCADE, related_name="recruitments"
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="recruitments",
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recruitments"
    )

    roles_needed = models.JSONField(default=list, blank=True)
    slots = models.PositiveSmallIntegerField(default=1)
    rank_requirement = models.CharField(max_length=80, blank=True)
    schedule = models.CharField(max_length=120, blank=True)
    type = models.CharField(max_length=20, choices=TYPE, default="competitive")
    status = models.CharField(max_length=20, choices=STATUS, default="open")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def application_count(self):
        return self.applications.count()

    def __str__(self):
        return self.title


class Application(models.Model):
    STATUS = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    recruitment = models.ForeignKey(
        Recruitment, on_delete=models.CASCADE, related_name="applications"
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications"
    )
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("recruitment", "applicant")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.applicant} → {self.recruitment} ({self.status})"
