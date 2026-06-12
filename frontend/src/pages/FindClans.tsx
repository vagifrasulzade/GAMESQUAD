import { useEffect, useState } from "react";
import { Users, MapPin } from "lucide-react";
import { api } from "../lib/api";
import type { Clan } from "../lib/types";
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

export default function FindClans() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<number | null>(null);
  const [joining, setJoining] = useState<number | null>(null);
  const [joined, setJoined] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  function load() {
    api
      .get("/clans/")
      .then((r) => {
        const results: Clan[] = r.data.results;
        setClans(results);
        // Persisted membership so "Joined ✓" survives reloads/restarts.
        setJoined(new Set(results.filter((c) => c.is_member).map((c) => c.id)));
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function join(id: number) {
    setJoining(id);
    setError("");
    try {
      await api.post(`/clans/${id}/join/`);
      setJoined((s) => new Set(s).add(id));
      load(); // refresh so member_count reflects the new member
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(
        status === 401
          ? "Your session expired — please log in again."
          : "Couldn't join the clan. Please try again."
      );
    } finally {
      setJoining(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Find Clans" subtitle="Join a community and play together." />
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clans.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar src={c.logo} alt={c.name} size={48} />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    {c.name}
                    {c.verified && <Verified />}
                  </div>
                  <p className="text-xs capitalize text-muted">{c.focus}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.games.map((g) => (
                  <Badge key={g.id} tone="brand">
                    <GameIcon game={g} size={14} /> {g.name}
                  </Badge>
                ))}
                {c.region && (
                  <Badge>
                    <MapPin className="h-3 w-3" /> {c.region}
                  </Badge>
                )}
                <Badge>
                  <Users className="h-3 w-3" /> {c.member_count}
                </Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewId(c.id)}
                >
                  View
                </Button>
                <Button
                  variant="good"
                  className="flex-1"
                  onClick={() => join(c.id)}
                  disabled={joining === c.id || joined.has(c.id)}
                >
                  {joined.has(c.id)
                    ? "Joined ✓"
                    : joining === c.id
                      ? "Joining..."
                      : "Join Clan"}
                </Button>
              </div>
            </Card>
          ))}
          {clans.length === 0 && <Card className="p-8 text-muted">No clans found.</Card>}
        </div>
      )}

      {viewId !== null && (
        <EntityModal kind="clan" id={viewId} onClose={() => setViewId(null)} />
      )}
    </div>
  );
}
