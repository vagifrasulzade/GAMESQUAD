"""Thin LLM client with Groq primary + OpenRouter fallback.

Both providers expose an OpenAI-compatible /chat/completions endpoint, so the
same payload works for each. If no API key is configured (or every provider
errors out), callers should fall back to the heuristic path -- the platform must
stay fully functional without any AI keys.
"""

from __future__ import annotations

import json
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class AIUnavailable(Exception):
    """Raised when no provider could fulfil the request."""


def _call(url: str, api_key: str, model: str, messages: list[dict], json_mode: bool):
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "temperature": 0.6}
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def chat(messages: list[dict], json_mode: bool = False) -> str:
    """Return the assistant text, trying Groq then OpenRouter."""

    from apps.accounts.models import AppSetting

    cfg = AppSetting.load()
    if not cfg.ai_enabled:
        raise AIUnavailable("AI is disabled in admin settings.")

    # Admin-configured model overrides win; otherwise fall back to .env defaults.
    groq_model = cfg.groq_model or settings.GROQ_MODEL
    openrouter_model = cfg.openrouter_model or settings.OPENROUTER_MODEL

    providers = []
    if settings.GROQ_API_KEY:
        providers.append((GROQ_URL, settings.GROQ_API_KEY, groq_model))
    if settings.OPENROUTER_API_KEY:
        providers.append((OPENROUTER_URL, settings.OPENROUTER_API_KEY, openrouter_model))

    for url, key, model in providers:
        try:
            return _call(url, key, model, messages, json_mode)
        except Exception as exc:  # noqa: BLE001 - try the next provider
            logger.warning("AI provider %s failed: %s", url, exc)

    raise AIUnavailable("No AI provider is configured or all providers failed.")


def chat_json(messages: list[dict], default: dict) -> dict:
    """Call chat() expecting JSON; return `default` on any failure."""
    try:
        raw = chat(messages, json_mode=True)
        return json.loads(raw)
    except (AIUnavailable, json.JSONDecodeError, KeyError) as exc:
        logger.info("Falling back to heuristic output: %s", exc)
        return default


def is_configured() -> bool:
    from apps.accounts.models import AppSetting

    if not AppSetting.load().ai_enabled:
        return False
    return bool(settings.GROQ_API_KEY or settings.OPENROUTER_API_KEY)
