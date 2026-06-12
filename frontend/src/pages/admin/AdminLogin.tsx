import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Activity,
  Settings2,
} from "lucide-react";
import { api, login as apiLogin, tokenStore } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../lib/types";

export default function AdminLogin() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiLogin(username, password);
      // Verify the account actually has admin (staff) access.
      const { data } = await api.get<User>("/users/me/");
      if (!data.is_staff && !data.is_superuser) {
        tokenStore.clear();
        setError("This account doesn't have admin access.");
        return;
      }
      await refreshUser();
      navigate("/admin");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b16] p-4">
      {/* Layered glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(50% 40% at 18% 12%, rgba(59,130,246,0.22) 0%, rgba(7,11,22,0) 70%), radial-gradient(45% 45% at 85% 90%, rgba(99,102,241,0.18) 0%, rgba(7,11,22,0) 70%)",
        }}
      />
      {/* Faint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        {/* Brand / hero panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-9 lg:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-400/20 blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-bold text-white">GameSquad</p>
              <p className="-mt-0.5 text-xs font-semibold tracking-[0.2em] text-blue-200">
                ADMIN
              </p>
            </div>
          </div>

          <div className="relative">
            <h2 className="text-2xl font-bold leading-snug text-white">
              Run the platform
              <br />
              from one console.
            </h2>
            <p className="mt-2 max-w-xs text-sm text-blue-100/80">
              Manage players, games, clans and reports with full operational control.
            </p>

            <ul className="mt-7 space-y-3.5">
              <Feature icon={<Users className="h-4 w-4" />} text="Members, teams & clans" />
              <Feature icon={<Settings2 className="h-4 w-4" />} text="Games & content catalog" />
              <Feature icon={<Activity className="h-4 w-4" />} text="Live stats & audit log" />
            </ul>
          </div>

          <p className="relative text-xs text-blue-200/70">
            © {new Date().getFullYear()} GameSquad · Admin Console
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          {/* Mobile brand */}
          <div className="mb-7 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-bold text-white">GameSquad</p>
              <p className="-mt-1 text-xs font-medium tracking-widest text-blue-400">ADMIN</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Sign in to the management panel. Staff accounts only.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field
              label="Username"
              icon={<UserIcon className="h-4 w-4" />}
              value={username}
              onChange={setUsername}
              placeholder="username"
              autoFocus
            />
            <Field
              label="Password"
              icon={<Lock className="h-4 w-4" />}
              type={showPw ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="text-slate-500 transition hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-xs text-slate-600 lg:hidden">
            © {new Date().getFullYear()} GameSquad · Admin Console
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-blue-50">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
        {icon}
      </span>
      {text}
    </li>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
  trailing,
  autoFocus,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  trailing?: React.ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-9 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
            trailing ? "pr-10" : "pr-3"
          }`}
        />
        {trailing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
    </label>
  );
}
