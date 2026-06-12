import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { api } from "../lib/api";
import type { Notification } from "../lib/types";
import { Button, Card, PageHeader, Spinner } from "../components/ui";

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get("/notifications/").then((r) => setItems(r.data.results)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function markAll() {
    await api.post("/notifications/mark_all_read/");
    load();
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        action={
          <Button variant="outline" onClick={markAll}>
            <Check className="h-4 w-4" /> Mark all read
          </Button>
        }
      />
      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="divide-y divide-line">
            {items.map((n) => (
              <div key={n.id} className={`flex gap-3 px-5 py-4 ${n.read ? "opacity-60" : ""}`}>
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-2">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </div>
                  {n.body && <p className="text-sm text-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="px-5 py-8 text-muted">You're all caught up.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
