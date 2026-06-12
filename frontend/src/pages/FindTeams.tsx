import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, MapPin } from "lucide-react";
import { api } from "../lib/api";
import type { Team } from "../lib/types";
import {
  Avatar,
  Badge,
  Button,
  Card,
  GameIcon,
  PageHeader,
  Spinner,
  Verified,
} from "../components/ui";
import EntityModal from "../components/EntityModal";

export default function FindTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [playstyle, setPlaystyle] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const game = searchParams.get("game") ?? "";

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (playstyle) params.playstyle = playstyle;
    if (game) params.game = game;
    api
      .get("/teams/", { params })
      .then((r) => setTeams(r.data.results))
      .finally(() => setLoading(false));
  }, [playstyle, game]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Find Teams"
        subtitle="Browse teams looking for players like you."
        action={
          <select
            value={playstyle}
            onChange={(e) => setPlaystyle(e.target.value)}
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">All playstyles</option>
            <option value="competitive">Competitive</option>
            <option value="casual">Casual</option>
          </select>
        }
      />

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar src={t.logo} alt={t.name} size={48} />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    {t.name}
                    {t.verified && <Verified />}
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <GameIcon game={t.game} size={14} />
                    {t.game.name}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted">{t.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">{t.playstyle}</Badge>
                {t.region && (
                  <Badge>
                    <MapPin className="h-3 w-3" /> {t.region}
                  </Badge>
                )}
                <Badge>
                  <Users className="h-3 w-3" /> {t.member_count}
                </Badge>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setViewId(t.id)}
              >
                View Team
              </Button>
            </Card>
          ))}
          {teams.length === 0 && <Card className="p-8 text-muted">No teams found.</Card>}
        </div>
      )}

      {viewId !== null && (
        <EntityModal kind="team" id={viewId} onClose={() => setViewId(null)} />
      )}
    </div>
  );
}
