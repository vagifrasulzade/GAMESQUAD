"""Create or update a superuser from env vars, idempotently.

Render's free tier has no shell, so we can't run `createsuperuser` by hand.
This command runs on every deploy: it reads ADMIN_USERNAME / ADMIN_PASSWORD /
ADMIN_EMAIL and ensures a matching staff superuser exists (creating it or
resetting its password). Safe to run repeatedly.
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Ensure a superuser exists, using ADMIN_USERNAME/ADMIN_PASSWORD/ADMIN_EMAIL."

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME", "admin")
        password = os.environ.get("ADMIN_PASSWORD")
        email = os.environ.get("ADMIN_EMAIL", "admin@gamesquad.gg")

        if not password:
            self.stdout.write(
                "ADMIN_PASSWORD not set; skipping superuser creation."
            )
            return

        user, created = User.objects.get_or_create(username=username)
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} superuser '{username}'."))
