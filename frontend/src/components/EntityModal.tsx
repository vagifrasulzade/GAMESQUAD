import { useEffect, useState } from "react";
import { Bookmark, MapPin, Users } from "lucide-react";
import { api } from "../lib/api";
import type { Clan, Game, Team } from "../lib/types";
import { Avatar, Badge, Button, GameIcon, Modal, Spinner, Verified } from "./ui";

type Kind = "team" | "clan";
type JoinState = "idle" | "joining" | "joined" | "error";

/**
 * Detail dialog for a team or clan. Fetches the full record by id so it can be
 * opened from anywhere we only have a kind + id (e.g. the AI matches list).
 */
export default function EntityModal({
  kind,
  id,
  onClose,
}: {
  kind: Kind;
  id: number;
  onClose: () => void;
}) {
  const [data, setData] = useState<Team | Clan | null>(null);
  const [loading, setLoading] = useState(true);
  const [join, setJoin] = useState<JoinState>("idle");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/${kind}s/${id}/`)
      .then((r) => {
        setData(r.data);
        // Reflect membership that was persisted on the server (survives reloads).
        if (r.data.is_member) setJoin("joined");
      })
      .finally(() => setLoading(false));
  }, [kind, id]);

  async function handleJoin() {
    setJoin("joining");
    try {
      await api.post(`/${kind}s/${id}/join/`);
      setJoin("joined");
    } catch {
      setJoin("error");
    }
  }

  async function handleSave() {
    // Optimistic — a duplicate save just 400s on the unique constraint, which is fine.
    setSaved(true);
    try {
      await api.post("/saved/", { target_type: kind, target_id: id });
    } catch {
      /* already saved */
    }
  }

  const label = kind === "clan" ? "Clan" : "Team";
  const games: Game[] = data
    ? kind === "clan"
      ? (data as Clan).games
      : [(data as Team).game]
    : [];
  const tag =
    data && (kind === "clan" ? (data as Clan).focus : (data as Team).playstyle);

  return (
    <Modal open onClose={onClose}>
      {loading || !data ? (
        <div className="p-12">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="h-24 bg-gradient-to-r from-brand/40 via-panel to-base" />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex items-end gap-4">
              <Avatar src={data.logo} alt={data.name} size={72} />
              <div className="pb-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-bold">{data.name}</h2>
                  {data.verified && <Verified />}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-2">
                  {label}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {games.map(
                (g) =>
                  g && (
                    <Badge key={g.id} tone="brand">
                      <GameIcon game={g} size={14} /> {g.name}
                    </Badge>
                  )
              )}
              {data.region && (
                <Badge>
                  <MapPin className="h-3 w-3" /> {data.region}
                </Badge>
              )}
              <Badge>
                <Users className="h-3 w-3" /> {data.member_count} member
                {data.member_count === 1 ? "" : "s"}
              </Badge>
              {tag && <Badge>{tag}</Badge>}
            </div>

            <p className="mt-4 text-sm text-muted">
              {data.description || "No description provided."}
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-lg bg-card2 p-3">
              <Avatar src={data.owner.avatar} alt={data.owner.username} size={36} />
              <div>
                <p className="text-xs text-muted">Owner</p>
                <p className="text-sm font-medium">{data.owner.username}</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant={kind === "clan" ? "good" : "primary"}
                className="flex-1"
                onClick={handleJoin}
                disabled={join === "joining" || join === "joined"}
              >
                {join === "joined"
                  ? "Joined ✓"
                  : join === "joining"
                    ? "Joining..."
                    : `Join ${label}`}
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={saved}>
                <Bookmark
                  className={`h-4 w-4 ${saved ? "fill-brand-2 text-brand-2" : ""}`}
                />
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
            {join === "error" && (
              <p className="mt-2 text-xs text-warn">Couldn't join. Please try again.</p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
