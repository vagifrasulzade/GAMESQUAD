import { useEffect, useState } from "react";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { api } from "../lib/api";
import type { GameEvent } from "../lib/types";
import { Badge, Button, Card, GameIcon, PageHeader, Spinner } from "../components/ui";

const MODES = ["", "tournament", "scrim", "community"] as const;

export default function Events() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>("");
  const [busy, setBusy] = useState<number | null>(null);

  function load() {
    setLoading(true);
    api
      .get("/events/", { params: mode ? { mode } : {} })
      .then((r) => setEvents(r.data.results))
      .finally(() => setLoading(false));
  }
  useEffect(load, [mode]);

  async function toggle(ev: GameEvent) {
    setBusy(ev.id);
    const action = ev.is_registered ? "unregister" : "register";
    try {
      await api.post(`/events/${ev.id}/${action}/`);
      setEvents((list) =>
        list.map((e) =>
          e.id === ev.id
            ? {
                ...e,
                is_registered: !e.is_registered,
                participant_count: e.participant_count + (e.is_registered ? -1 : 1),
              }
            : e
        )
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Events"
        subtitle="Tournaments, scrims and community events you can join."
        action={
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm capitalize outline-none focus:border-brand"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m === "" ? "All events" : m}
              </option>
            ))}
          </select>
        }
      />

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((ev) => (
            <Card key={ev.id} className="flex flex-col overflow-hidden">
              <div className="relative h-28 bg-gradient-to-r from-brand/30 via-panel to-base">
                {ev.banner && (
                  <img
                    src={ev.banner}
                    alt=""
                    className="h-full w-full object-cover opacity-70"
                  />
                )}
                <span className="absolute left-3 top-3">
                  <Badge tone="brand">
                    <span className="capitalize">{ev.mode}</span>
                  </Badge>
                </span>
                {ev.game && (
                  <span className="absolute bottom-3 right-3 rounded-lg bg-base/80 p-1.5">
                    <GameIcon game={ev.game} size={26} />
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold">{ev.title}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  {ev.game && <GameIcon game={ev.game} size={14} />}
                  {ev.game?.name ?? "Multiple games"} · {ev.format}
                </p>

                <p className="mt-2 line-clamp-2 text-sm text-muted">{ev.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>
                    <Calendar className="h-3 w-3" />
                    {new Date(ev.starts_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Badge>
                  {ev.region && (
                    <Badge>
                      <MapPin className="h-3 w-3" /> {ev.region}
                    </Badge>
                  )}
                  {ev.prize && (
                    <Badge tone="good">
                      <Trophy className="h-3 w-3" /> {ev.prize}
                    </Badge>
                  )}
                  <Badge>
                    <Users className="h-3 w-3" /> {ev.participant_count}/{ev.max_teams}
                  </Badge>
                </div>

                <Button
                  variant={ev.is_registered ? "ghost" : "primary"}
                  className="mt-4 w-full"
                  onClick={() => toggle(ev)}
                  disabled={busy === ev.id}
                >
                  {ev.is_registered ? "Registered ✓ — Leave" : "Register"}
                </Button>
              </div>
            </Card>
          ))}
          {events.length === 0 && <Card className="p-8 text-muted">No events scheduled.</Card>}
        </div>
      )}
    </div>
  );
}
