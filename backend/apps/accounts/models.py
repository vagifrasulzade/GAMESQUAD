from django.contrib.auth.models import AbstractUser
from django.db import models


class Playstyle(models.TextChoices):
    COMPETITIVE = "competitive", "Competitive"
    CASUAL = "casual", "Casual"


class LookingFor(models.TextChoices):
    TEAM = "team", "Team"
    CLAN = "clan", "Clan"
    PLAYERS = "players", "Players"
    ANY = "any", "Any"


class Status(models.TextChoices):
    ONLINE = "online", "Online"
    IDLE = "idle", "Idle"
    DND = "dnd", "Do Not Disturb"
    OFFLINE = "offline", "Offline"


class User(AbstractUser):
    """A gamer account. Username acts as the unique handle (e.g. 'Vaqif')."""

    tag = models.CharField(max_length=10, blank=True, help_text="Discriminator, e.g. 1337")
    avatar = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    country = models.CharField(max_length=60, blank=True)
    region = models.CharField(max_length=40, blank=True, help_text="EU, NA, ...")
    languages = models.JSONField(default=list, blank=True)

    is_online = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ONLINE
    )
    verified = models.BooleanField(default=False)

    playstyle = models.CharField(
        max_length=20, choices=Playstyle.choices, default=Playstyle.COMPETITIVE
    )
    looking_for = models.CharField(
        max_length=20, choices=LookingFor.choices, default=LookingFor.ANY
    )
    main_roles = models.JSONField(default=list, blank=True)

    # Availability
    availability_days = models.JSONField(default=list, blank=True)  # ["Fri", "Sat"]
    availability_from = models.CharField(max_length=10, blank=True)  # "18:00"
    availability_to = models.CharField(max_length=10, blank=True)    # "02:00"

    # Stats
    wins = models.PositiveIntegerField(default=0)
    kd = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    matches = models.PositiveIntegerField(default=0)

    @property
    def display_tag(self):
        return f"{self.username}#{self.tag}" if self.tag else self.username

    @property
    def full_name(self):
        """Real name ("First Last"), or empty when none has been set."""
        return self.get_full_name()

    def __str__(self):
        return self.display_tag


class AppSetting(models.Model):
    """Singleton row holding admin-editable platform configuration.

    Stored in the DB so changes made in the admin panel persist across server
    restarts (unlike the `.env` defaults, which only seed the first row)."""

    site_name = models.CharField(max_length=80, default="GameSquad")
    allow_registration = models.BooleanField(default=True)
    # Master switch — lets staff force heuristic mode even when API keys exist.
    ai_enabled = models.BooleanField(default=True)
    # Model overrides; blank means "use the .env default".
    groq_model = models.CharField(max_length=120, blank=True)
    openrouter_model = models.CharField(max_length=120, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "App settings"
        verbose_name_plural = "App settings"

    def save(self, *args, **kwargs):
        self.pk = 1  # enforce a single row
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        from django.conf import settings

        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "groq_model": getattr(settings, "GROQ_MODEL", "") or "",
                "openrouter_model": getattr(settings, "OPENROUTER_MODEL", "") or "",
            },
        )
        return obj

    def __str__(self):
        return "App settings"


class GameAccount(models.Model):
    """A user's profile for a specific game (in-game name, rank, role)."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="game_accounts"
    )
    game = models.ForeignKey(
        "games.Game", on_delete=models.CASCADE, related_name="accounts"
    )
    in_game_name = models.CharField(max_length=80, blank=True)
    rank = models.CharField(max_length=40, blank=True)
    role = models.CharField(max_length=40, blank=True)

    class Meta:
        unique_together = ("user", "game")

    def __str__(self):
        return f"{self.user} · {self.game}"
