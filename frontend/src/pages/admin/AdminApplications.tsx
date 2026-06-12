import { useEffect, useState } from "react";
import { api, fetchAll } from "../../lib/api";
import type { User } from "../../lib/types";
import { AdminHeader, Pagination, Panel, Table, Row, Cell, Pill, Avatar2, statusTone, fmtDate, usePagination } from "./adminUi";

interface Application {
  id: number;
  recruitment_title: string;
  applicant: User;
  message: string;
  status: string;
  created_at: string;
}

type StatusFilter = "all" | "pending" | "completed" | "other";

export default function AdminApplications() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  function load() {
    setLoading(true);
    fetchAll<Application>("/applications/")
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function markAccepted(app: Application) {
    try {
      await api.patch(`/applications/${app.id}/`, { status: "accepted" });
      load();
    } catch {
      alert("Failed to update application status");
    }
  }

  async function markRejected(app: Application) {
    try {
      await api.patch(`/applications/${app.id}/`, { status: "rejected" });
      load();
    } catch {
      alert("Failed to update application status");
    }
  }

  const filtered = items.filter((a) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return a.status === "pending";
    if (statusFilter === "completed") return a.status === "accepted" || a.status === "rejected";
    if (statusFilter === "other") return a.status !== "pending" && a.status !== "accepted" && a.status !== "rejected";
    return true;
  });

  const counts = {
    all: items.length,
    pending: items.filter((a) => a.status === "pending").length,
    completed: items.filter((a) => a.status === "accepted" || a.status === "rejected").length,
    other: items.filter((a) => a.status !== "pending" && a.status !== "accepted" && a.status !== "rejected").length,
  };

  const { page, setPage, pageCount, pageItems, total } = usePagination(filtered);

  return (
    <div className="animate-fade-in">
      <AdminHeader title="Applications" subtitle={`${filtered.length} of ${items.length} applications`} />
      
      {/* Status Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "pending", "completed", "other"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-900"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              statusFilter === status ? "bg-blue-700" : "bg-slate-800"
            }`}>
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      <Panel>
        <Table columns={["Applicant", "Recruitment", "Message", "Status", "Date", ""]} loading={loading} empty={filtered.length === 0}>
          {pageItems.map((a) => (
            <Row key={a.id}>
              <Cell>
                <div className="flex items-center gap-2.5">
                  <Avatar2 name={a.applicant.username} />
                  <span className="font-medium text-white">{a.applicant.username}</span>
                </div>
              </Cell>
              <Cell>{a.recruitment_title}</Cell>
              <Cell className="max-w-xs truncate text-slate-400">{a.message || "—"}</Cell>
              <Cell>
                <Pill tone={statusTone(a.status)}>{a.status}</Pill>
              </Cell>
              <Cell>{fmtDate(a.created_at)}</Cell>
              <Cell>
                {a.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAccepted(a)}
                      className="rounded-lg bg-green-600/20 px-3 py-1.5 text-sm font-medium text-green-300 transition hover:bg-green-600/30"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => markRejected(a)}
                      className="rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-600/30"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </Cell>
            </Row>
          ))}
        </Table>
        <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
      </Panel>
    </div>
  );
}
