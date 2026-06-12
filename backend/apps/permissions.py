"""Shared DRF permission classes used across the API."""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrReadOnly(BasePermission):
    """Anyone can read; only staff can create/update/delete."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsStaffOrOwnerOrReadOnly(BasePermission):
    """Read for everyone, create for any authenticated user, but edit/delete
    only for the object's owner or staff."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user and request.user.is_staff:
            return True
        return getattr(obj, "owner", None) == request.user
