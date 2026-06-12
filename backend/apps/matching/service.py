"""AI matchmaking: heuristic scoring + optional LLM-written explanations."""

from __future__ import annotations

from apps.clans.models import Clan
from apps.teams.models import Team

from . import ai


# ---------------------------------------------------------------------------
# Heuristic compatibility scoring
# ---------------------------------------------------------------------------
def _overlap(a, b) -> float:
    a, b = set(map(str.lower, a or [])), set(map(str.lower, b or []))
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _score_breakdown(user, *, games, region, playstyle, roles, languages):
    """Return a dict of 0-100 sub-scores plus an overall score."""
    user_games = [ga.game.slug for ga in user.game_accounts.all()]

    role_match = round(60 + 40 * _overlap(user.main_roles, roles))
    game_match = round(50 + 50 * _overlap(user_games, games))
    playstyle_match = 95 if playstyle == user.playstyle else 70
    activity_match = 80 + (16 if user.availability_days else 0)
    language_match = round(60 + 40 * _overlap(user.languages, languages))
    region_match = 100 if region and region == user.region else 75

    breakdown = {
        "Role Match": min(role_match, 100),
        "Rank Match": game_match,
        "Playstyle": playstyle_match,
        "Activity Time": min(activity_match, 100),
        "Language": language_match,
    }
    overall = round(
        0.25 * breakdown["Role Match"]
        + 0.2 * breakdown["Rank Match"]
        + 0.2 * breakdown["Playstyle"]
        + 0.2 * breakdown["Activity Time"]
        + 0.15 * breakdown["Language"]
        + 0.0 * region_match
    )
    return breakdown, min(max(overall, 40), 99)


def _heuristic_reasons(name, breakdown):
    reasons = []
    if breakdown["Role Match"] >= 85:
        reasons.append("Same preferred roles")
    if breakdown["Rank Match"] >= 80:
        reasons.append("Plays your main games")
    if breakdown["Playstyle"] >= 90:
        reasons.append("Both play competitively")
    if breakdown["Activity Time"] >= 85:
        reasons.append("Active at the same hours")
    if breakdown["Language"] >= 85:
        reasons.append("Speaks your languages")
    if not reasons:
        reasons = ["Similar profile", "Open and recruiting", "Worth a look"]
    return reasons[:5]


def _ai_reasons(user, target_name, target_kind, breakdown):
    """Ask the LLM for short bullet reasons; fall back to heuristics."""
    default = {"reasons": _heuristic_reasons(target_name, breakdown)}
    if not ai.is_configured():
        return default["reasons"]
    messages = [
        {
            "role": "system",
            "content": (
                "You are GameSquad's matchmaking assistant. Given a player and a "
                "candidate, output JSON {\"reasons\": [...]} with 4-5 very short "
                "(<=6 word) bullet reasons this is a good match. No fluff."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Player roles={user.main_roles}, playstyle={user.playstyle}, "
                f"languages={user.languages}, region={user.region}. "
                f"Candidate {target_kind} '{target_name}' compatibility={breakdown}."
            ),
        },
    ]
    return ai.chat_json(messages, default).get("reasons", default["reasons"])


def _serialize_target(obj, kind):
    if kind == "team":
        games = [obj.game] if getattr(obj, "game_id", None) else []
    else:
        games = list(obj.games.all())
    return {
        "id": obj.id,
        "kind": kind,
        "name": obj.name,
        "logo": obj.logo,
        "description": obj.description,
        "verified": obj.verified,
        "region": obj.region,
        "member_count": obj.member_count,
        "playstyle": getattr(obj, "playstyle", None) or getattr(obj, "focus", None),
        "game": games[0].name if len(games) == 1 else None,
        "games": [
            {"id": g.id, "name": g.name, "icon": g.icon, "color": g.color}
            for g in games
        ],
    }


def build_matches(user, kind="all", limit=10):
    """Return ranked match cards for teams and/or clans."""
    candidates = []
    if kind in ("all", "teams"):
        candidates += [(t, "team") for t in Team.objects.select_related("game")[:30]]
    if kind in ("all", "clans"):
        candidates += [(c, "clan") for c in Clan.objects.prefetch_related("games")[:30]]

    results = []
    for obj, obj_kind in candidates:
        if obj_kind == "team":
            games = [obj.game.slug] if obj.game_id else []
        else:
            games = [g.slug for g in obj.games.all()]
        breakdown, overall = _score_breakdown(
            user,
            games=games,
            region=obj.region,
            playstyle=getattr(obj, "playstyle", None) or getattr(obj, "focus", None),
            roles=user.main_roles,
            languages=user.languages,
        )
        card = _serialize_target(obj, obj_kind)
        card["compatibility"] = overall
        card["breakdown"] = breakdown
        card["reasons"] = _heuristic_reasons(obj.name, breakdown)
        results.append(card)

    results.sort(key=lambda c: c["compatibility"], reverse=True)
    top = results[:limit]

    # Only spend an LLM call enriching the very top matches.
    for card in top[:3]:
        card["reasons"] = _ai_reasons(user, card["name"], card["kind"], card["breakdown"])
    return top


# ---------------------------------------------------------------------------
# Conversational assistant
# ---------------------------------------------------------------------------
def assistant_reply(user, history, message):
    matches = build_matches(user, limit=3)
    top = matches[0] if matches else None

    if not ai.is_configured():
        if top:
            text = (
                f"Your top match is {top['name']} at {top['compatibility']}% "
                f"compatibility. {' · '.join(top['reasons'][:3])}. "
                "Connect your game accounts for sharper results."
            )
        else:
            text = "Add your games, roles and rank so I can find your squad."
        return {"reply": text, "suggestions": ["Show me more teams", "Find clans instead", "What can I improve?"], "top_match": top}

    convo = [
        {
            "role": "system",
            "content": (
                "You are GameSquad's friendly AI matchmaking assistant. Be concise, "
                "encouraging and esports-savvy. Help the player understand and improve "
                f"their matches. The player's top match data: {top}."
            ),
        }
    ]
    for turn in history[-6:]:
        convo.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    convo.append({"role": "user", "content": message})

    try:
        text = ai.chat(convo)
    except ai.AIUnavailable:
        text = "I'm having trouble reaching the AI service right now — try again shortly."
    return {
        "reply": text,
        "suggestions": ["Show me more teams", "Find clans instead", "What can I improve?"],
        "top_match": top,
    }
