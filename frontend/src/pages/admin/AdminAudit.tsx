import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { api } from "../../lib/api";
import { AdminHeader, Panel, Table, Row, Cell, Pill } from "./adminUi";

interface AuditEntry {
  id: number;
  user: string;
  action: string;
  object: string;
  model: string;
  message: string;
  time: string;
}

const ACTION_TONE: Record<string, "green" | "blue" | "red"> = {
  Created: "green",
  Updated: "blue",
  Deleted: "red",
};

export default function AdminAudit() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/audit/")
      .then((r) => setItems(r.data.results))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <AdminHeader title="Audit Logs" subtitle="Recent administrative actions" />

      {!loading && items.length === 0 && (
        <Panel className="flex flex-col items-center gap-3 py-16 text-center">
          <ScrollText className="h-9 w-9 text-blue-400" />
          <p className="text-sm text-slate-400">
            No audit entries yet. Actions taken in the Django admin (create / edit / delete) will
            appear here.
          </p>
        </Panel>
      )}

      {(loading || items.length > 0) && (
        <Panel>
          <Table columns={["When", "User", "Action", "Object", "Model", "Details"]} loading={loading} empty={false}>
            {items.map((e) => (
              <Row key={e.id}>
                <Cell>{new Date(e.time).toLocaleString()}</Cell>
                <Cell className="text-white">{e.user}</Cell>
                <Cell>
                  <Pill tone={ACTION_TONE[e.action] ?? "slate"}>{e.action}</Pill>
                </Cell>
                <Cell>{e.object}</Cell>
                <Cell className="capitalize">{e.model}</Cell>
                <Cell className="max-w-xs truncate text-slate-400">{e.message}</Cell>
              </Row>
            ))}
          </Table>
        </Panel>
      )}
    </div>
  );
}
