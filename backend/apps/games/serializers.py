from django.utils.text import slugify
from rest_framework import serializers

from .models import Game


class GameSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Game
        fields = ["id", "name", "slug", "icon", "color", "roles", "ranks", "is_active"]

    def validate(self, attrs):
        if not attrs.get("slug") and attrs.get("name"):
            attrs["slug"] = slugify(attrs["name"])
        return attrs
