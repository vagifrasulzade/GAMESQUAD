"""Seed the database with demo gamers, games, teams, clans, events and recruitments.

Generates ~20 of each core entity. The curated demo records (Vaqif, Night Owls,
etc.) are kept first so logins and screenshots stay stable; the rest are
generated deterministically (fixed RNG seed) so re-running is idempotent.
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import GameAccount
from apps.clans.models import Clan, ClanMembership
from apps.events.models import Event
from apps.games.models import Game
from apps.social.models import Notification
from apps.teams.models import Recruitment, Team, TeamMembership

User = get_user_model()

DEFAULT_RANKS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster"]

GAMES = [
    {"name": "Valorant", "color": "#ff4655", "icon": "https://cdn.simpleicons.org/valorant/ff4655",
     "roles": ["Duelist", "Controller", "Initiator", "Sentinel"],
     "ranks": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"]},
    {"name": "CS2", "color": "#f7b500", "icon": "https://cdn.simpleicons.org/counterstrike/f7b500",
     "roles": ["Entry", "AWPer", "Support", "IGL", "Lurker"],
     "ranks": ["Silver", "Gold Nova", "Master Guardian", "Legendary Eagle", "Supreme", "Global Elite"]},
    {"name": "Apex Legends", "color": "#da292a", "icon": "https://logos-world.net/wp-content/uploads/2020/11/Apex-Legends-Emblem.png",
     "roles": ["Fragger", "Support", "Recon", "IGL"],
     "ranks": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Predator"]},
    {"name": "League of Legends", "color": "#1e9de3", "icon": "https://cdn.simpleicons.org/leagueoflegends/1e9de3",
     "roles": ["Top", "Jungle", "Mid", "ADC", "Support"],
     "ranks": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Challenger"]},
    {"name": "Dota 2", "color": "#b41916", "icon": "https://cdn.simpleicons.org/dota2/b41916",
     "roles": ["Carry", "Mid", "Offlane", "Soft Support", "Hard Support"],
     "ranks": ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"]},
    {"name": "Overwatch 2", "color": "#f99e1a", "icon": "",
     "roles": ["Tank", "DPS", "Support"],
     "ranks": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Top 500"]},
    {"name": "Rainbow Six Siege", "color": "#0b7dbd", "icon": "",
     "roles": ["Entry", "Support", "Anchor", "Flex", "IGL"],
     "ranks": ["Copper", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Champion"]},
    {"name": "Fortnite", "color": "#7d3ff2", "icon": "",
     "roles": ["Fragger", "Builder", "IGL", "Support"], "ranks": DEFAULT_RANKS + ["Elite", "Champion", "Unreal"]},
    {"name": "Call of Duty: Warzone", "color": "#4a8f29", "icon": "",
     "roles": ["Slayer", "Support", "Objective", "IGL"], "ranks": DEFAULT_RANKS + ["Crimson", "Iridescent"]},
    {"name": "PUBG: Battlegrounds", "color": "#f2a900", "icon": "",
     "roles": ["Fragger", "Support", "Driver", "IGL"],
     "ranks": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Conqueror"]},
    {"name": "Rocket League", "color": "#1a73e8", "icon": "",
     "roles": ["Striker", "Midfielder", "Goalkeeper"],
     "ranks": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion", "Grand Champion", "Supersonic Legend"]},
    {"name": "Teamfight Tactics", "color": "#1e9de3", "icon": "",
     "roles": ["Flex", "Fast 8", "Reroll"],
     "ranks": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Challenger"]},
    {"name": "Marvel Rivals", "color": "#e23636", "icon": "",
     "roles": ["Vanguard", "Duelist", "Strategist"],
     "ranks": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Grandmaster", "Eternity", "One Above All"]},
    {"name": "Halo Infinite", "color": "#3a7a3a", "icon": "",
     "roles": ["Slayer", "Objective", "Support", "IGL"],
     "ranks": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Onyx"]},
    {"name": "Mobile Legends", "color": "#1f6feb", "icon": "",
     "roles": ["Gold Laner", "EXP Laner", "Mid Laner", "Jungler", "Roamer"],
     "ranks": ["Warrior", "Elite", "Master", "Grandmaster", "Epic", "Legend", "Mythic"]},
    {"name": "Brawlhalla", "color": "#e0a000", "icon": "",
     "roles": ["Aggro", "Support", "Flex"], "ranks": ["Tin", "Bronze", "Silver", "Gold", "Platinum", "Diamond"]},
    {"name": "Destiny 2", "color": "#5f8bcc", "icon": "",
     "roles": ["Hunter", "Titan", "Warlock"], "ranks": ["Guardian", "Brave", "Heroic", "Fabled", "Mythic", "Legend"]},
    {"name": "Smite", "color": "#9b59b6", "icon": "",
     "roles": ["Solo", "Jungle", "Mid", "Carry", "Support"],
     "ranks": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Masters", "Grandmaster"]},
    {"name": "Paladins", "color": "#2e8b57", "icon": "",
     "roles": ["Front Line", "Damage", "Flank", "Support"], "ranks": DEFAULT_RANKS},
    {"name": "The Finals", "color": "#d6204a", "icon": "",
     "roles": ["Light", "Medium", "Heavy"],
     "ranks": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ruby"]},
]

# Curated users kept for stable demo logins / screenshots.
USERS = [
    {"username": "Vaqif", "first_name": "Vaqif", "last_name": "Resulzade", "tag": "1337", "region": "EU",
     "languages": ["English", "Azerbaijani"], "main_roles": ["Controller", "Support"], "playstyle": "competitive",
     "wins": 128, "kd": 1.45, "matches": 347, "verified": True, "is_online": True, "status": "online",
     "availability_days": ["Fri", "Sat", "Sun"], "availability_from": "18:00", "availability_to": "02:00"},
    {"username": "ShadowX", "first_name": "Murad", "last_name": "Aliyev", "tag": "7788", "region": "EU",
     "languages": ["English"], "main_roles": ["Entry", "AWPer"], "playstyle": "competitive",
     "wins": 210, "kd": 1.31, "matches": 540, "is_online": True, "status": "online"},
    {"username": "LobaMain", "first_name": "Leyla", "last_name": "Huseynova", "tag": "9991", "region": "EU",
     "languages": ["English", "German"], "main_roles": ["Support"], "playstyle": "casual",
     "wins": 88, "kd": 1.05, "matches": 190, "status": "idle"},
    {"username": "TurboNinja", "first_name": "Tural", "last_name": "Guliyev", "tag": "0420", "region": "NA",
     "languages": ["English"], "main_roles": ["AWPer"], "playstyle": "competitive",
     "wins": 305, "kd": 1.62, "matches": 700, "status": "dnd"},
    {"username": "KillerBee", "first_name": "Kamran", "last_name": "Hasanov", "tag": "0117", "region": "EU",
     "languages": ["English", "Azerbaijani"], "main_roles": ["Duelist"], "playstyle": "competitive",
     "wins": 150, "kd": 1.4, "matches": 360, "status": "online", "is_online": True},
    {"username": "namigismayilli", "first_name": "Namig", "last_name": "Isamyilli", "tag": "2024", "region": "EU",
     "languages": ["English", "Azerbaijani", "Turkish"], "main_roles": ["Duelist", "Initiator"],
     "playstyle": "competitive", "wins": 193, "kd": 1.77, "matches": 421, "verified": True,
     "is_online": True, "status": "online",
     "availability_days": ["Mon", "Wed", "Fri", "Sat", "Sun"], "availability_from": "19:00", "availability_to": "01:00"},
]

# Pools used to generate the remaining records.
FIRST_NAMES = ["Elvin", "Nigar", "Aysel", "Rashad", "Sevda", "Orxan", "Gunay", "Emin", "Nurlan", "Farid",
               "Aytac", "Samir", "Ravan", "Ilkin", "Zaur", "Ulvi", "Aydan", "Kenan", "Vusal", "Sabina",
               "Elnur", "Gular", "Ramil", "Tunar", "Leman"]
LAST_NAMES = ["Mammadov", "Aliyev", "Huseynov", "Guliyev", "Hasanov", "Ismayilov", "Aghayev", "Rzayev",
              "Karimov", "Safarov", "Najafov", "Babayev", "Veliyev", "Abbasov", "Jafarov", "Musayev",
              "Orujov", "Ahmadov", "Bayramov", "Sultanov"]
GAMER_ADJ = ["Shadow", "Turbo", "Killer", "Frost", "Night", "Cyber", "Storm", "Iron", "Toxic", "Rapid",
             "Silent", "Crimson", "Phantom", "Venom", "Blaze", "Rogue", "Lunar", "Savage", "Hyper", "Mystic"]
GAMER_NOUN = ["Ninja", "Sniper", "Wolf", "Reaper", "Hawk", "Viper", "Bee", "Fox", "Dragon", "Knight",
              "Ghost", "Falcon", "Tiger", "Raven", "Bolt", "Hunter", "Wizard", "Demon", "Phoenix", "Shark"]
REGIONS = ["EU", "EU West", "EU East", "NA", "NA East", "LATAM", "MENA", "Asia", "Korea", "Oceania", "CIS"]
LANGS = ["English", "Azerbaijani", "Turkish", "Russian", "German", "French", "Spanish", "Arabic", "Korean"]
STATUSES = ["online", "idle", "dnd", "offline"]
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

TEAM_NAMES = ["Night Owls", "Red Sharks", "Pixel Legends", "Neon Titans", "Iron Wolves", "Golden Vipers",
              "Shadow Hawks", "Frost Dragons", "Crimson Reapers", "Azure Foxes", "Toxic Knights",
              "Royal Ravens", "Storm Phoenix", "Lunar Tigers", "Savage Bolts", "Phantom Hunters",
              "Mystic Demons", "Rapid Guardians", "Silent Falcons", "Cyber Kings"]
TEAM_VERIFIED = {"Night Owls", "Red Sharks"}

CLAN_NAMES = ["Azerbaijan Legends", "Phoenix Rising", "Eclipse Syndicate", "Nova Collective", "Vanguard Elite",
              "Obsidian Order", "Radiant Coalition", "Tempest Brotherhood", "Apex Dynasty", "Zenith Union",
              "Crimson Covenant", "Frostborn Clan", "Shadow Pact", "Aurora Guild", "Titan Forge",
              "Ember Legion", "Stormfront Society", "Onyx Alliance", "Velocity Crew", "Spectre Division"]
CLAN_VERIFIED = {"Azerbaijan Legends"}
CLAN_FOCUS = ["competitive", "casual", "mixed", "content", "social"]

TEAM_DESCRIPTIONS = [
    "Competitive roster grinding ranked every night. Discipline and good vibes.",
    "Looking for dedicated players to complete our lineup for the next season.",
    "Casual squad chasing wins and good vibes — no toxicity allowed.",
    "Scrim-focused team preparing for upcoming online cups.",
    "Semi-pro roster with coaching and VOD reviews twice a week.",
]
CLAN_DESCRIPTIONS = [
    "Friendly community with organized events and a tournament focus.",
    "Rising competitive clan with active Discord and weekly scrims.",
    "Multi-game community for players who want chill teammates.",
    "Content-driven clan — clips, streams and community nights.",
    "Large social guild welcoming all ranks and regions.",
]
EVENT_SUFFIXES = ["Weekend Cup", "Ranked Scrim Night", "Open Bracket", "Championship", "Community Clash",
                  "Showmatch", "Pro-Am Invitational", "Ladder Finals", "Summer Showdown", "Winter Open"]
EVENT_MODES = ["tournament", "scrim", "community"]
EVENT_PRIZES = ["$500", "$250", "$1000", "Bragging rights", "In-game skins", "$750", "Hardware bundle"]


def crest(seed: str) -> str:
    """A colorful gradient emblem that reads like a team/clan logo."""
    return (
        "https://api.dicebear.com/9.x/shapes/svg"
        f"?seed={seed}&backgroundType=gradientLinear&radius=12"
    )


class Command(BaseCommand):
    help = "Seed demo data for GameSquad (≈20 of each entity)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--fresh",
            action="store_true",
            help="Wipe existing demo data (keeps staff/superusers) before seeding.",
        )

    def handle(self, *args, **options):
        rng = random.Random(42)

        if options["fresh"]:
            self.stdout.write("Clearing demo data...")
            Event.objects.all().delete()
            Recruitment.objects.all().delete()
            Team.objects.all().delete()
            Clan.objects.all().delete()
            Notification.objects.all().delete()
            GameAccount.objects.all().delete()
            User.objects.filter(is_superuser=False, is_staff=False).delete()
            Game.objects.all().delete()

        # --- Games -----------------------------------------------------------
        self.stdout.write("Seeding games...")
        games = {}
        for g in GAMES:
            game, _ = Game.objects.update_or_create(
                slug=slugify(g["name"]),
                defaults={"name": g["name"], "color": g["color"], "icon": g["icon"],
                          "roles": g["roles"], "ranks": g["ranks"]},
            )
            games[g["name"]] = game
        game_list = list(games.values())

        # --- Users (20) ------------------------------------------------------
        self.stdout.write("Seeding users...")
        user_specs = list(USERS)
        used_usernames = {u["username"] for u in user_specs}
        while len(user_specs) < 20:
            uname = f"{rng.choice(GAMER_ADJ)}{rng.choice(GAMER_NOUN)}{rng.randint(1, 99)}"
            if uname in used_usernames:
                continue
            used_usernames.add(uname)
            status = rng.choice(STATUSES)
            base_game = rng.choice(GAMES)
            user_specs.append({
                "username": uname,
                "first_name": rng.choice(FIRST_NAMES),
                "last_name": rng.choice(LAST_NAMES),
                "tag": str(rng.randint(0, 9999)).zfill(4),
                "region": rng.choice(REGIONS),
                "languages": rng.sample(LANGS, rng.randint(1, 3)),
                "main_roles": rng.sample(base_game["roles"], min(2, len(base_game["roles"]))),
                "playstyle": rng.choice(["competitive", "casual"]),
                "wins": rng.randint(10, 600), "kd": round(rng.uniform(0.7, 2.0), 2),
                "matches": rng.randint(50, 900), "verified": rng.random() < 0.3,
                "is_online": status == "online", "status": status,
                "availability_days": sorted(rng.sample(DAYS, rng.randint(2, 5)), key=DAYS.index),
                "availability_from": rng.choice(["16:00", "18:00", "19:00", "20:00"]),
                "availability_to": rng.choice(["22:00", "23:00", "00:00", "02:00"]),
            })

        users = {}
        for u in user_specs:
            # Precompute the random game accounts up front so the RNG advances
            # the same way whether or not this user already exists (idempotency).
            account_specs = [
                (g, rng.choice(g["ranks"]), rng.choice(g["roles"]))
                for g in rng.sample(GAMES, rng.randint(1, 3))
            ]
            user, created = User.objects.get_or_create(
                username=u["username"], defaults={k: v for k, v in u.items() if k != "username"}
            )
            if created:
                user.set_password("demo12345")
                for k, v in u.items():
                    setattr(user, k, v)
                user.email = f"{u['username'].lower()}@gamesquad.gg"
                user.avatar = f"https://i.pravatar.cc/150?u={user.username}"
                user.save()
                for g, rank, role in account_specs:
                    GameAccount.objects.get_or_create(
                        user=user, game=games[g["name"]],
                        defaults={"in_game_name": user.username, "rank": rank, "role": role},
                    )
            users[u["username"]] = user
        user_list = list(users.values())

        # --- Teams (20) ------------------------------------------------------
        self.stdout.write("Seeding teams...")
        teams = {}
        for i, name in enumerate(TEAM_NAMES):
            owner = rng.choice(user_list)
            team, _ = Team.objects.get_or_create(
                slug=slugify(name),
                defaults={
                    "name": name, "game": rng.choice(game_list),
                    "playstyle": rng.choice(["competitive", "casual"]),
                    "region": rng.choice(REGIONS), "verified": name in TEAM_VERIFIED,
                    "description": TEAM_DESCRIPTIONS[i % len(TEAM_DESCRIPTIONS)], "owner": owner,
                    "logo": crest(slugify(name)),
                },
            )
            # Refresh the logo on re-seed so demo crests stay up to date.
            if team.logo != crest(slugify(name)):
                team.logo = crest(slugify(name))
                team.save(update_fields=["logo"])
            TeamMembership.objects.get_or_create(team=team, user=team.owner, defaults={"role": "owner"})
            for member in rng.sample(user_list, rng.randint(2, 5)):
                TeamMembership.objects.get_or_create(team=team, user=member, defaults={"role": "member"})
            teams[name] = team
        team_list = list(teams.values())

        # --- Clans (20) ------------------------------------------------------
        self.stdout.write("Seeding clans...")
        for i, name in enumerate(CLAN_NAMES):
            owner = rng.choice(user_list)
            clan_games = rng.sample(game_list, rng.randint(1, 3))
            clan, created = Clan.objects.get_or_create(
                slug=slugify(name),
                defaults={
                    "name": name, "focus": rng.choice(CLAN_FOCUS), "region": rng.choice(REGIONS),
                    "verified": name in CLAN_VERIFIED,
                    "description": CLAN_DESCRIPTIONS[i % len(CLAN_DESCRIPTIONS)], "owner": owner,
                    "logo": crest(slugify(name)),
                },
            )
            if clan.logo != crest(slugify(name)):
                clan.logo = crest(slugify(name))
                clan.save(update_fields=["logo"])
            if created:
                clan.games.set(clan_games)
            ClanMembership.objects.get_or_create(clan=clan, user=clan.owner, defaults={"role": "owner"})
            for member in rng.sample(user_list, rng.randint(2, 6)):
                ClanMembership.objects.get_or_create(clan=clan, user=member, defaults={"role": "member"})

        # --- Recruitments (20) ----------------------------------------------
        self.stdout.write("Seeding recruitments...")
        schedules = ["Tonight 20:00", "Weekends", "Weekday evenings", "Flexible", "Daily after 19:00"]
        for i in range(20):
            game_spec = GAMES[i % len(GAMES)]
            creator = rng.choice(user_list)
            roles_needed = rng.sample(game_spec["roles"], min(rng.randint(1, 2), len(game_spec["roles"])))
            Recruitment.objects.get_or_create(
                title=f"{game_spec['name']}: need {', '.join(roles_needed)}",
                created_by=creator, game=games[game_spec["name"]],
                defaults={
                    "roles_needed": roles_needed, "slots": rng.randint(1, 4),
                    "rank_requirement": f"{rng.choice(game_spec['ranks'])}+",
                    "schedule": rng.choice(schedules),
                    "type": rng.choice(["competitive", "casual"]),
                    "status": "open" if rng.random() < 0.8 else "closed",
                    "description": "Filling our roster — bring comms and a good attitude.",
                },
            )

        # --- Events (20) -----------------------------------------------------
        self.stdout.write("Seeding events...")
        for i in range(20):
            game_spec = GAMES[i % len(GAMES)]
            title = f"{game_spec['name']} {EVENT_SUFFIXES[i % len(EVENT_SUFFIXES)]}"
            event, _ = Event.objects.get_or_create(
                slug=slugify(title),
                defaults={
                    "title": title, "game": games[game_spec["name"]], "mode": rng.choice(EVENT_MODES),
                    "format": rng.choice(["5v5", "3v3", "1v1", "Battle Royale"]),
                    "region": rng.choice(REGIONS), "prize": rng.choice(EVENT_PRIZES),
                    "max_teams": rng.choice([8, 16, 20, 32]),
                    "description": "Open registration. Casted live — check the GameSquad Discord for details.",
                    "host": rng.choice(user_list),
                    "starts_at": timezone.now() + timedelta(days=rng.randint(1, 30)),
                    "banner": crest(slugify(title)),
                },
            )
            event.participants.add(*rng.sample(user_list, rng.randint(3, 8)))

        # --- A couple of notifications for the demo account ------------------
        Notification.objects.get_or_create(
            user=users["Vaqif"], type="invite", title="Night Owls Clan",
            defaults={"body": "We would like to invite you!"},
        )
        Notification.objects.get_or_create(
            user=users["Vaqif"], type="match", title="New AI matches ready",
            defaults={"body": "We found 5 new teams that fit your style."},
        )

        self.stdout.write(self.style.SUCCESS(
            f"Done! {User.objects.count()} users, {Team.objects.count()} teams, "
            f"{Clan.objects.count()} clans, {Game.objects.count()} games, "
            f"{Recruitment.objects.count()} recruitments, {Event.objects.count()} events. "
            "Demo password: 'demo12345' (e.g. login as 'Vaqif')."
        ))
