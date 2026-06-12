from django.contrib import admin

from .models import Clan, ClanMembership


class ClanMembershipInline(admin.TabularInline):
    model = ClanMembership
    extra = 0
    raw_id_fields = ("user",)


@admin.register(Clan)
class ClanAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "focus", "member_count", "verified")
    list_filter = ("focus", "verified", "region")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ClanMembershipInline]
