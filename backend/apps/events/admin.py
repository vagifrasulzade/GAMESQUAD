from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "game", "mode", "region", "starts_at")
    list_filter = ("mode", "region")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title",)
