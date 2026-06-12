import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User as UserIcon,
  Users,
  Shield,
  Megaphone,
  Sparkles,
  Calendar,
  MessageSquare,
  Bell,
  Bookmark,
  Settings,
  Gamepad2,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GlobalSearch from "./GlobalSearch";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/teams", label: "Find Teams", icon: Users },
  { to: "/clans", label: "Find Clans", icon: Shield },
  { to: "/recruitment", label: "Recruitment", icon: Megaphone },
  { to: "/matches", label: "Matches (AI)", icon: Sparkles, badge: "New" },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-panel md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">GameSquad</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-brand/15 text-brand-2"
                    : "text-muted hover:bg-card2 hover:text-white"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-card2 hover:text-white"
        >
          <LogOut className="h-4.5 w-4.5" />
          Log out
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center gap-4 border-b border-line bg-panel px-6 py-3">
          <GlobalSearch />
          <div className="flex items-center gap-3">
            <NavLink
              to="/games"
              title="Browse games"
              className={({ isActive }) =>
                `rounded-lg border border-line p-2 hover:text-white ${
                  isActive ? "text-brand-2" : "text-muted"
                }`
              }
            >
              <Gamepad2 className="h-5 w-5" />
            </NavLink>
            <NavLink to="/notifications" className="relative rounded-lg border border-line p-2 text-muted hover:text-white">
              <Bell className="h-5 w-5" />
            </NavLink>
            <NavLink to="/messages" className="rounded-lg border border-line p-2 text-muted hover:text-white">
              <MessageSquare className="h-5 w-5" />
            </NavLink>
      
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
