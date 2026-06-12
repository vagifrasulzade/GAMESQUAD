import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Trophy, Crosshair, Swords } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { MatchCard, Recruitment } from "../lib/types";
import { Avatar, Badge, Button, Card, GameIcon, Spinner, Verified } from "../components/ui";

// Placeholder stats so the profile card looks populated in the demo.
// Real values from the backend take precedence once they're non-zero.
const DEMO_STATS = { wins: 47, kd: "1.82", matches: 128 };

// Treats "0" / "0.00" as empty so the demo fallback can kick in.
function kdValue(kd?: string) {
  return kd && parseFloat(kd) > 0 ? kd : "";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/matches/"),
      api.get("/recruitments/", { params: { status: "open" } }),
    ])
      .then(([m, r]) => {
        setMatches(m.data.results.slice(0, 3));
        setRecruitments(r.data.results.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-brand/30 via-panel to-base p-8">
        <h1 className="text-3xl font-bold">Find Your Squad. Play. Win. Repeat.</h1>
        <p className="mt-2 max-w-lg text-muted">
          Connect with gamers, find the perfect team or clan and dominate together.
        </p>
        <div className="mt-5 flex gap-3">
          <Button to="/teams">Find Teams</Button>
          <Button to="/clans" variant="outline">Find Clans</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Matches */}
        <Card className="lg:col-span-2">
          <SectionHeader title="AI Matches For You" to="/matches" icon={<Sparkles className="h-4 w-4 text-brand-2" />} />
          <div className="divide-y divide-line">
            {matches.map((m) => (
              <Link
                to="/matches"
                key={`${m.kind}-${m.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-card2"
              >
                <Avatar src={m.logo} alt={m.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{m.name}</span>
                    {m.verified && <Verified />}
                  </div>
                  <p className="truncate text-xs text-muted">
                    Why it matches? {m.reasons.slice(0, 2).join(", ")}
                  </p>
                </div>
                <span className="text-lg font-bold text-good">{m.compatibility}%</span>
              </Link>
            ))}
            {matches.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted">No matches yet — complete your profile.</p>
            )}
          </div>
        </Card>

        {/* Profile overview */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Your Profile
            </h3>
            <Link to="/profile" className="text-xs text-brand-2 hover:underline">
              Edit Profile
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} alt={user?.username ?? "U"} size={56} online={user?.is_online} />
            <div>
              <div className="flex items-center gap-1.5 font-semibold">
                {user?.username}
                {user?.verified && <Verified />}
              </div>
              <span className="text-xs text-good">Online</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat icon={<Trophy className="h-4 w-4" />} label="Wins" value={user?.wins || DEMO_STATS.wins} />
            <Stat icon={<Crosshair className="h-4 w-4" />} label="K/D" value={kdValue(user?.kd) || DEMO_STATS.kd} />
            <Stat icon={<Swords className="h-4 w-4" />} label="Matches" value={user?.matches || DEMO_STATS.matches} />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase text-muted">Roles</p>
            <div className="flex flex-wrap gap-2">
              {user?.main_roles.map((r) => (
                <Badge key={r} tone="brand">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase text-muted">Languages</p>
            <div className="flex flex-wrap gap-2">
              {user?.languages.map((l) => (
                <Badge key={l}>{l}</Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Active recruitments */}
      <Card>
        <SectionHeader title="Active Recruitments" to="/recruitment" />
        <div className="grid gap-px bg-line md:grid-cols-3">
          {recruitments.map((r) => (
            <div key={r.id} className="bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.title}</span>
                <Badge tone={r.type === "competitive" ? "brand" : "default"}>{r.type}</Badge>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                {r.game.slug ? (
                  <Link to={`/games/${r.game.slug}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <GameIcon game={r.game} size={14} />
                    {r.game.name}
                  </Link>
                ) : (
                  <>
                    <GameIcon game={r.game} size={14} />
                    {r.game.name}
                  </>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.roles_needed.slice(0, 2).map((role) => (
                  <Badge key={role}>{role}</Badge>
                ))}
                {r.rank_requirement && <Badge>{r.rank_requirement}</Badge>}
              </div>
              <Button to="/recruitment" className="mt-4 w-full" variant="outline">
                View
              </Button>
            </div>
          ))}
          {recruitments.length === 0 && (
            <p className="bg-card p-5 text-sm text-muted">No open recruitments.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function SectionHeader({
  title,
  to,
  icon,
}: {
  title: string;
  to: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {icon}
        {title}
      </div>
      <Link to={to} className="flex items-center gap-1 text-xs text-brand-2 hover:underline">
        View All <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card2 py-3">
      <div className="flex justify-center text-brand-2">{icon}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
