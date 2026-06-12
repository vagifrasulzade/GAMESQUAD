import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Trophy, Users } from "lucide-react";
import { api } from "../lib/api";
import type { Game } from "../lib/types";
import { Badge, Card, GameIcon, PageHeader, Spinner } from "../components/ui";

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/games/")
      .then((r) => setGames(r.data.results))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Games" subtitle="Every title supported on GameSquad." />

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <div
                className="flex items-center gap-4 p-5"
                style={{
                  background: `linear-gradient(90deg, ${g.color}22, transparent)`,
                }}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-base/60">
                  <GameIcon game={g} size={36} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold">{g.name}</h3>
                  <p className="text-xs text-muted">{g.roles.length} roles · {g.ranks.length} ranks</p>
                </div>
              </div>

              <div className="space-y-3 p-5 pt-0">
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted">
                    <Compass className="h-3.5 w-3.5" /> Roles
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.roles.length ? (
                      g.roles.map((r) => (
                        <Badge key={r} tone="brand">
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted">
                    <Trophy className="h-3.5 w-3.5" /> Ranks
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.ranks.length ? (
                      g.ranks.map((r) => <Badge key={r}>{r}</Badge>)
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/teams?game=${g.slug}`)}
                  className="mt-1 flex items-center gap-1.5 text-sm text-brand-2 hover:underline"
                >
                  <Users className="h-4 w-4" /> Find {g.name} teams
                </button>
              </div>
            </Card>
          ))}
          {games.length === 0 && <Card className="p-8 text-muted">No games yet.</Card>}
        </div>
      )}
    </div>
  );
}
