from django.contrib import admin

from .models import Game


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
