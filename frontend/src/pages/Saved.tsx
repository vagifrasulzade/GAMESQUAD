import { useEffect, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import type { SavedItem } from "../lib/types";
import { Avatar, Badge, Card, GameIcon, PageHeader, Spinner } from "../components/ui";
import EntityModal from "../components/EntityModal";

export default function Saved() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<{ kind: "team" | "clan"; id: number } | null>(null);

  function load() {
    setLoading(true);
    api
      .get("/saved/")
      .then((r) => setItems(r.data.results))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(id: number) {
    await api.delete(`/saved/${id}/`);
    setItems((list) => list.filter((i) => i.id !== id));
  }

  function open(item: SavedItem) {
    if (item.target_type === "team" || item.target_type === "clan") {
      setView({ kind: item.target_type, id: item.target_id });
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Saved" subtitle="Teams, clans and posts you bookmarked." />

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-3 p-4">
              <button
                onClick={() => open(item)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                {item.target?.logo ? (
                  <Avatar src={item.target.logo} alt={item.target.name} size={44} />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-2">
                    <Bookmark className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.target?.name ?? `${item.target_type} #${item.target_id}`}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs capitalize text-muted">
                    {item.target?.games?.[0] && (
                      <GameIcon game={item.target.games[0]} size={13} />
                    )}
                    {item.target?.subtitle ?? item.target_type}
                  </p>
                </div>
              </button>
              <Badge>{item.target_type}</Badge>
              <button
                onClick={() => remove(item.id)}
                aria-label="Remove"
                className="rounded-lg p-2 text-muted transition hover:bg-card2 hover:text-warn"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
          {items.length === 0 && (
            <Card className="flex flex-col items-center gap-3 py-16 text-center md:col-span-2 xl:col-span-3">
              <Bookmark className="h-8 w-8 text-brand-2" />
              <p className="text-muted">
                Nothing saved yet. Use the <span className="text-white">Save</span> button on a
                team or clan to bookmark it here.
              </p>
            </Card>
          )}
        </div>
      )}

      {view && <EntityModal kind={view.kind} id={view.id} onClose={() => setView(null)} />}
    </div>
  );
}
