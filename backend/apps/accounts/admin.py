from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import GameAccount, User


class GameAccountInline(admin.TabularInline):
    model = GameAccount
    extra = 0


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = [GameAccountInline]
    list_display = ("username", "tag", "region", "playstyle", "verified", "is_online", "is_staff")
    list_filter = ("playstyle", "verified", "is_online", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        (
            "Gamer profile",
            {
                "fields": (
                    "tag",
                    "avatar",
                    "bio",
                    "country",
                    "region",
                    "languages",
                    "playstyle",
                    "looking_for",
                    "main_roles",
                    "availability_days",
                    "availability_from",
                    "availability_to",
                    "wins",
                    "kd",
                    "matches",
                    "verified",
                    "is_online",
                )
            },
        ),
    )
