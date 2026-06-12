from django.contrib import admin

from .models import Application, Recruitment, Team, TeamMembership


class TeamMembershipInline(admin.TabularInline):
    model = TeamMembership
    extra = 0
    raw_id_fields = ("user",)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "game", "playstyle", "member_count", "verified")
    list_filter = ("playstyle", "verified", "game")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [TeamMembershipInline]


class ApplicationInline(admin.TabularInline):
    model = Application
    extra = 0
    raw_id_fields = ("applicant",)


@admin.register(Recruitment)
class RecruitmentAdmin(admin.ModelAdmin):
    list_display = ("title", "game", "created_by", "type", "status", "application_count", "created_at")
    list_filter = ("type", "status", "game")
    search_fields = ("title",)
    inlines = [ApplicationInline]


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("applicant", "recruitment", "status", "created_at")
    list_filter = ("status",)
