from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as serve_media
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.admin_views import AdminSettingsView, AdminStatsView, AuditLogView
from apps.accounts.views import GameAccountViewSet, RegisterView, UserViewSet
from apps.clans.views import ClanViewSet
from apps.events.views import EventViewSet
from apps.games.views import GameViewSet
from apps.matching.views import assistant, matches
from apps.social.views import (
    ConversationViewSet,
    MessageViewSet,
    NotificationViewSet,
    ReportViewSet,
    SavedItemViewSet,
)
from apps.teams.views import ApplicationViewSet, RecruitmentViewSet, TeamViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("game-accounts", GameAccountViewSet, basename="game-account")
router.register("games", GameViewSet, basename="game")
router.register("clans", ClanViewSet, basename="clan")
router.register("teams", TeamViewSet, basename="team")
router.register("events", EventViewSet, basename="event")
router.register("recruitments", RecruitmentViewSet, basename="recruitment")
router.register("applications", ApplicationViewSet, basename="application")
router.register("conversations", ConversationViewSet, basename="conversation")
router.register("messages", MessageViewSet, basename="message")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("saved", SavedItemViewSet, basename="saved")
router.register("reports", ReportViewSet, basename="report")

api_patterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("matches/", matches, name="matches"),
    path("matches/assistant/", assistant, name="assistant"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/audit/", AuditLogView.as_view(), name="admin-audit"),
    path("admin/settings/", AdminSettingsView.as_view(), name="admin-settings"),
    path("", include(router.urls)),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api_patterns)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]

# Serve uploaded media (avatars) in every environment. These live on a
# persistent disk (Render) / volume (Railway); Django streams them since there's
# no separate CDN. We use django.views.static.serve directly instead of the
# conf.urls.static.static() helper because that helper is a no-op when
# DEBUG=False, which silently 404s every uploaded image in production.
_media_prefix = settings.MEDIA_URL.lstrip("/")
urlpatterns += [
    re_path(
        rf"^{_media_prefix}(?P<path>.*)$",
        serve_media,
        {"document_root": settings.MEDIA_ROOT},
    ),
]
