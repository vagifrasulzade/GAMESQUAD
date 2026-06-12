import { useEffect, useState } from "react";
import { api, fetchAll } from "../../lib/api";
import type { User } from "../../lib/types";
import { AdminHeader, Pagination, Panel, Table, Row, Cell, Pill, statusTone, fmtDate, usePagination } from "./adminUi";

interface Report {
  id: number;
  reporter: User;
  type: string;
  target_label: string;
  reason: string;
  status: string;
  created_at: string;
}

const STATUSES = ["open", "in_progress", "resolved"];

export default function AdminReports() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll<Report>("/reports/")
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const { page, setPage, pageCount, pageItems, total } = usePagination(items);

  async function changeStatus(id: number, status: string) {
    const { data } = await api.post(`/reports/${id}/set_status/`, { status });
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: data.status } : r)));
  }

  return (
    <div className="animate-fade-in">
      <AdminHeader title="Reports" subtitle={`${items.length} reports`} />
      <Panel>
        <Table columns={["Type", "Target", "Reason", "Reporter", "Status", "Date", ""]} loading={loading} empty={items.length === 0}>
          {pageItems.map((r) => (
            <Row key={r.id}>
              <Cell className="capitalize text-white">{r.type}</Cell>
              <Cell>{r.target_label || "—"}</Cell>
              <Cell className="max-w-xs truncate text-slate-400">{r.reason}</Cell>
              <Cell>{r.reporter.username}</Cell>
              <Cell>
                <Pill tone={statusTone(r.status)}>{r.status.replace("_", " ")}</Pill>
              </Cell>
              <Cell>{fmtDate(r.created_at)}</Cell>
              <Cell>
                <select
                  value={r.status}
                  onChange={(e) => changeStatus(r.id, e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs capitalize text-white outline-none focus:border-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </Cell>
            </Row>
          ))}
        </Table>
        <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
      </Panel>
    </div>
  );
}
