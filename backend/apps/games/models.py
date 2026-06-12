from django.db import models


class Game(models.Model):
    """A game title supported on the platform (Valorant, CS2, ...)."""

    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    icon = models.URLField(blank=True)
    color = models.CharField(max_length=20, default="#7c3aed")
    # Reference data stored as simple JSON lists so we stay schema-light.
    roles = models.JSONField(default=list, blank=True)
    ranks = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
