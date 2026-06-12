import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Sparkles, Eye, EyeOff, RefreshCw, User, Mail, Lock, IdCard } from "lucide-react";
import { generateUsername } from "../lib/username";
import { useAuth } from "../context/AuthContext";
import { api, tokenStore } from "../lib/api";
import type { User as UserType } from "../lib/types";
import { Button } from "../components/ui";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await login(username, password);
        // Staff/admin accounts must use the dedicated admin login.
        const { data } = await api.get<UserType>("/users/me/");
        if (data.is_staff || data.is_superuser) {
          tokenStore.clear();
          window.location.assign("/admin/login");
          return;
        }
      } else {
        await register({ username, email, password, full_name: fullName });
      }
      navigate("/");
    } catch (err) {
      const data = (err as { response?: { data?: Record<string, string | string[]> } }).response?.data;
      if (data?.username) {
        setError(`Username: ${Array.isArray(data.username) ? data.username[0] : data.username}`);
      } else if (data?.email) {
        setError(`Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`);
      } else if (data?.password) {
        setError(`Password: ${Array.isArray(data.password) ? data.password[0] : data.password}`);
      } else {
        setError(mode === "login" ? "Invalid credentials." : "Could not register that user.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-line shadow-2xl md:grid-cols-2">
        {/* Hero */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand/40 via-panel to-base p-8 md:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">GameSquad</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Find Your Squad.
              <br />
              Play. Win. Repeat.
            </h2>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Connect with gamers, find the perfect team or clan, and let our AI match you
              with players that fit your style.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-sm text-brand-2">
              <Sparkles className="h-4 w-4" /> AI-powered matchmaking
            </div>
          </div>
          <p className="text-xs text-muted">© {new Date().getFullYear()} GameSquad</p>
        </div>

        {/* Form */}
        <div className="bg-panel p-8">
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "login" ? "Log in to find your squad." : "Join the GameSquad community."}
          </p>

          {/* Mode switch */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-line bg-base p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-md py-2 text-sm font-medium transition ${
                  mode === m ? "bg-brand text-white shadow" : "text-muted hover:text-white"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field
              label="Username"
              value={username}
              onChange={setUsername}
              icon={<User className="h-4 w-4" />}
              placeholder="Username"
              autoComplete="username"
              trailing={
                mode === "register" && (
                  <IconButton
                    onClick={() => setUsername(generateUsername({ withNumber: true, separator: "" }))}
                    label="Generate username"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </IconButton>
                )
              }
            />

            {mode === "register" && (
              <>
                <Field
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  icon={<IdCard className="h-4 w-4" />}
                  placeholder="Full name"
                  autoComplete="name"
                />
                <Field
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </>
            )}

            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type={showPassword ? "text" : "password"}
              icon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              trailing={
                <IconButton
                  onClick={() => setShowPassword((s) => !s)}
                  label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconButton>
              }
            />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {mode === "login" ? "No account yet? " : "Already have one? "}
            <button
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="font-medium text-brand-2 hover:underline"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>

          <p className="mt-3 text-center text-xs text-muted">
            Are you an administrator?{" "}
            <Link to="/admin/login" className="font-medium text-brand-2 hover:underline">
              Admin login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon,
  trailing,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-line bg-base py-2.5 text-sm outline-none transition placeholder:text-muted/50 focus:border-brand focus:ring-2 focus:ring-brand/25 ${
            icon ? "pl-10" : "pl-3.5"
          } ${trailing ? "pr-11" : "pr-3.5"}`}
        />
        {trailing && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
    </label>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-md p-1.5 text-muted transition hover:bg-card2 hover:text-white"
    >
      {children}
    </button>
  );
}
