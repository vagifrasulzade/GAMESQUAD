import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Game as GameType } from "../lib/types";
import { Spinner, GameIcon, PageHeader, Card } from "../components/ui";

export default function Game() {
  const { slug } = useParams();
  const [game, setGame] = useState<GameType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get(`/games/${slug}/`)
      .then((res) => setGame(res.data))
      .catch(() => setGame(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner />;
  if (!game) return <p className="p-6 text-sm text-muted">Game not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={game.name} subtitle={game.slug} />
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <GameIcon game={game} size={64} />
          <div>
            <p className="mb-2 text-sm text-muted">Roles</p>
            <div className="mb-4">{game.roles.join(", ")}</div>
            <p className="mb-2 text-sm text-muted">Ranks</p>
            <div>{game.ranks.join(", ")}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
