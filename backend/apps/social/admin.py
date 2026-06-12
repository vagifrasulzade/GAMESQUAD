from django.contrib import admin

from .models import Conversation, Message, Notification, Report, SavedItem


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "conversation", "body", "read", "created_at")
    list_filter = ("read",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "title", "read", "created_at")
    list_filter = ("type", "read")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("type", "target_label", "reporter", "status", "created_at")
    list_filter = ("type", "status")


admin.site.register(Conversation)
admin.site.register(SavedItem)

admin.site.site_header = "GameSquad Admin"
admin.site.site_title = "GameSquad Admin"
admin.site.index_title = "Management"
