import { useEffect, useState } from "react";
import { Clock, Users, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import type { Recruitment as Rec } from "../lib/types";
import { Avatar, Badge, Button, Card, GameIcon, PageHeader, Spinner } from "../components/ui";

export default function Recruitment() {
  const [items, setItems] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  useEffect(() => {
    api
      .get("/recruitments/", { params: { status: "open" } })
      .then((r) => {
        const results: Rec[] = r.data.results;
        setItems(results);
        // Restore which ones the user has already applied to (persisted server-side).
        setApplied(new Set(results.filter((x) => x.has_applied).map((x) => x.id)));
      })
      .finally(() => setLoading(false));
  }, []);

  async function apply(id: number) {
    try {
      await api.post(`/recruitments/${id}/apply/`, { message: "I'd like to join!" });
      setApplied((s) => new Set(s).add(id));
    } catch {
      /* already applied */
      setApplied((s) => new Set(s).add(id));
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Recruitment" subtitle="Open spots looking to be filled right now." />
      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <Card key={r.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
              <Avatar src={r.created_by.avatar} alt={r.created_by.username} size={48} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <GameIcon game={r.game} size={18} />
                  <span className="font-semibold">{r.title}</span>
                  <Badge tone={r.type === "competitive" ? "brand" : "default"}>{r.type}</Badge>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <GameIcon game={r.game} size={14} />
                  {r.game.name} · by {r.created_by.username}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.roles_needed.map((role) => (
                    <Badge key={role}>{role}</Badge>
                  ))}
                  {r.rank_requirement && (
                    <Badge>
                      <ShieldCheck className="h-3 w-3" /> {r.rank_requirement}
                    </Badge>
                  )}
                  {r.schedule && (
                    <Badge>
                      <Clock className="h-3 w-3" /> {r.schedule}
                    </Badge>
                  )}
                  <Badge>
                    <Users className="h-3 w-3" /> {r.slots} slot{r.slots > 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => apply(r.id)}
                disabled={applied.has(r.id)}
                variant={applied.has(r.id) ? "ghost" : "primary"}
                className="md:w-32"
              >
                {applied.has(r.id) ? "Applied ✓" : "Apply"}
              </Button>
            </Card>
          ))}
          {items.length === 0 && <Card className="p-8 text-muted">No open recruitments.</Card>}
        </div>
      )}
    </div>
  );
}
