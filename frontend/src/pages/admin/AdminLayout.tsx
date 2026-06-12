import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Shield,
  Swords,
  ClipboardList,
  MessageSquare,
  Flag,
  Settings,
  ScrollText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { section: "Management", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/games", label: "Games", icon: Gamepad2 },
    { to: "/admin/clans", label: "Clans", icon: Shield },
    { to: "/admin/teams", label: "Teams & Recruitment", icon: Swords },
    { to: "/admin/applications", label: "Applications", icon: ClipboardList },
    { to: "/admin/messages", label: "Messages", icon: MessageSquare },
    { to: "/admin/reports", label: "Reports", icon: Flag },
  ]},
  { section: "System", items: [
    { to: "/admin/settings", label: "Settings", icon: Settings },
    { to: "/admin/audit", label: "Audit Logs", icon: ScrollText },
  ]},
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1120] text-slate-400">
        Loading…
      </div>
    );
  if (!user || (!user.is_staff && !user.is_superuser))
    return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1120] text-slate-200">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white">GameSquad Admin</span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            navigate("/admin/login");
          }}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" /> Log out
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-slate-800 bg-slate-900 px-6 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white">{user.username}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
