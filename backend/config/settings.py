"""
Django settings for the GameSquad project.
"""

from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def env(key, default=None):
    return os.environ.get(key, default)


SECRET_KEY = env(
    "SECRET_KEY",
    "django-insecure-l=h@a0@z54anz4dwj7q569e9dkxfpqa#1w(7$*@vg@^0#=j*h_",
)

DEBUG = env("DEBUG", "True") == "True"

ALLOWED_HOSTS = env("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# The host platform exposes the public domain in an env var; trust it
# automatically. Render uses RENDER_EXTERNAL_HOSTNAME, Railway RAILWAY_PUBLIC_DOMAIN.
PLATFORM_HOST = env("RENDER_EXTERNAL_HOSTNAME") or env("RAILWAY_PUBLIC_DOMAIN")
if PLATFORM_HOST:
    ALLOWED_HOSTS.append(PLATFORM_HOST)

# Behind the platform's proxy, tell Django the original request was HTTPS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Origins allowed to send authenticated POSTs (Django admin, session auth).
CSRF_TRUSTED_ORIGINS = [
    o for o in env("CSRF_TRUSTED_ORIGINS", "").split(",") if o
]
if PLATFORM_HOST:
    CSRF_TRUSTED_ORIGINS.append(f"https://{PLATFORM_HOST}")


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
    # local
    "apps.accounts",
    "apps.games",
    "apps.clans",
    "apps.teams",
    "apps.social",
    "apps.matching",
    "apps.events",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# Uses DATABASE_URL (Postgres) in production; falls back to local SQLite.
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
# On Railway, point MEDIA_ROOT at the mounted persistent volume so uploaded
# avatars survive redeploys. Locally this falls back to ./media.
MEDIA_ROOT = Path(env("MEDIA_ROOT", str(BASE_DIR / "media")))

# WhiteNoise serves the collected static files (Django admin + DRF UI).
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}

# User-uploaded media (avatars). Render's free disk is ephemeral, so when a
# CLOUDINARY_URL is configured we store uploads on Cloudinary's free CDN instead;
# the URL survives redeploys. Without it (local dev) we keep filesystem storage.
# The cloudinary SDK auto-reads the CLOUDINARY_URL env var on import.
CLOUDINARY_URL = env("CLOUDINARY_URL", "")
if CLOUDINARY_URL:
    INSTALLED_APPS += ["cloudinary", "cloudinary_storage"]
    STORAGES["default"] = {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=12),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "GameSquad API",
    "DESCRIPTION": "Find your squad. Play. Win. Repeat.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# CORS (frontend dev server)
CORS_ALLOWED_ORIGINS = env(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
CORS_ALLOW_CREDENTIALS = True


# ----------------------------------------------------------------------------
# AI providers (Groq primary, OpenRouter fallback). No keys => heuristic mode.
# ----------------------------------------------------------------------------
GROQ_API_KEY = env("GROQ_API_KEY", "")
GROQ_MODEL = env("GROQ_MODEL", "llama-3.3-70b-versatile")
OPENROUTER_API_KEY = env("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = env("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")
