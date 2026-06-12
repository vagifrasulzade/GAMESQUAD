import { useEffect, useState } from "react";
import {
  Users,
  Shield,
  ClipboardList,
  MessageSquare,
  Megaphone,
  Flag,
  Activity,
} from "lucide-react";
import { api } from "../../lib/api";
import type { Recruitment, User } from "../../lib/types";
import { Panel, Table, Row, Cell, Pill, Avatar2, fmtDate } from "./adminUi";

interface Stats {
  total_users: number;
  online_users: number;
  clans: number;
  teams: number;
  recruitments: number;
  open_recruitments: number;
  applications: number;
  messages: number;
  reports: number;
  open_reports: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recs, setRecs] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>("/admin/stats/"),
      api.get("/users/"),
      api.get("/recruitments/"),
    ])
      .then(([s, u, r]) => {
        setStats(s.data);
        setUsers(u.data.results.slice(0, 6));
        setRecs(r.data.results.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Users", value: stats?.total_users, sub: `${stats?.online_users ?? 0} online`, icon: <Users className="h-5 w-5" /> },
    { label: "Active Users", value: stats?.online_users, sub: "online now", icon: <Activity className="h-5 w-5" /> },
    { label: "Clans", value: stats?.clans, sub: "communities", icon: <Shield className="h-5 w-5" /> },
    { label: "Recruitments", value: stats?.recruitments, sub: `${stats?.open_recruitments ?? 0} open`, icon: <Megaphone className="h-5 w-5" /> },
    { label: "Applications", value: stats?.applications, sub: "submitted", icon: <ClipboardList className="h-5 w-5" /> },
    { label: "Reports", value: stats?.reports, sub: `${stats?.open_reports ?? 0} open`, icon: <Flag className="h-5 w-5" /> },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Overview of the GameSquad platform.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{c.label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
                {c.icon}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {loading ? "…" : (c.value ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest users */}
        <Panel>
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3">
            <Users className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Latest Users</h2>
          </div>
          <Table columns={["User", "Region", "Status"]} loading={loading} empty={users.length === 0}>
            {users.map((u) => (
              <Row key={u.id}>
                <Cell>
                  <div className="flex items-center gap-2.5">
                    <Avatar2 name={u.username} />
                    <span className="font-medium text-white">{u.username}</span>
                  </div>
                </Cell>
                <Cell>{u.region || "—"}</Cell>
                <Cell>
                  <Pill tone={u.is_online ? "green" : "slate"}>{u.is_online ? "Online" : "Offline"}</Pill>
                </Cell>
              </Row>
            ))}
          </Table>
        </Panel>

        {/* Recent recruitments */}
        <Panel>
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3">
            <Megaphone className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Recent Recruitments</h2>
          </div>
          <Table columns={["Title", "Game", "Apps", "Created"]} loading={loading} empty={recs.length === 0}>
            {recs.map((r) => (
              <Row key={r.id}>
                <Cell className="text-white">{r.title}</Cell>
                <Cell>{r.game.name}</Cell>
                <Cell>{r.application_count}</Cell>
                <Cell>{fmtDate(r.created_at)}</Cell>
              </Row>
            ))}
          </Table>
        </Panel>
      </div>

      {/* Messages count hint */}
      <Panel className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
          <MessageSquare className="h-5 w-5" />
        </span>
        <span className="text-sm text-slate-300">
          {loading ? "…" : (stats?.messages ?? 0).toLocaleString()} messages ·{" "}
          {loading ? "…" : (stats?.teams ?? 0).toLocaleString()} teams on the platform
        </span>
      </Panel>
    </div>
  );
}
