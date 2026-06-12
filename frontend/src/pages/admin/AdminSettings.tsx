import { useEffect, useState } from "react";
import { Save, Check, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { AdminHeader, Panel } from "./adminUi";

interface Settings {
  site_name: string;
  allow_registration: boolean;
  ai_enabled: boolean;
  groq_model: string;
  openrouter_model: string;
  ai_keys_configured: boolean;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Settings>("/admin/settings/")
      .then((r) => setS(r.data))
      .catch(() => setError("Couldn't load settings."));
  }, []);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!s) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.patch<Settings>("/admin/settings/", {
        site_name: s.site_name,
        allow_registration: s.allow_registration,
        ai_enabled: s.ai_enabled,
        groq_model: s.groq_model,
        openrouter_model: s.openrouter_model,
      });
      setS(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save settings. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <AdminHeader title="Settings" subtitle="Platform configuration — saved to the database" />

      {!s ? (
        <Panel className="p-6 text-sm text-slate-400">
          {error || "Loading…"}
        </Panel>
      ) : (
        <form onSubmit={save}>
          <Panel className="space-y-5 p-6">
            <Text label="Site name" value={s.site_name} onChange={(v) => set("site_name", v)} />

            <Toggle
              label="Allow new registrations"
              description="Let new gamers create accounts."
              value={s.allow_registration}
              onChange={(v) => set("allow_registration", v)}
            />
          </Panel>

          <Panel className="mt-6 space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">AI matchmaking</h2>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                  s.ai_keys_configured
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {s.ai_keys_configured ? "Keys configured" : "No API keys"}
              </span>
            </div>

            <Toggle
              label="Enable AI features"
              description="When off, the platform uses heuristic matching only."
              value={s.ai_enabled}
              onChange={(v) => set("ai_enabled", v)}
            />

            <Text
              label="Groq model"
              value={s.groq_model}
              onChange={(v) => set("groq_model", v)}
              placeholder="llama-3.3-70b-versatile"
              disabled={!s.ai_enabled}
            />
            <Text
              label="OpenRouter model"
              value={s.openrouter_model}
              onChange={(v) => set("openrouter_model", v)}
              placeholder="meta-llama/llama-3.3-70b-instruct"
              disabled={!s.ai_enabled}
            />
            <p className="text-xs text-slate-500">
              Model changes are stored in the database and take effect immediately — they survive
              server restarts. API keys remain in <code className="text-slate-400">.env</code>.
            </p>
          </Panel>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" /> {error}
              </span>
            )}
          </div>
        </form>
      )}

      <Panel className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-white">Signed in as</h2>
        <p className="mt-1 text-sm text-slate-400">
          {user?.username} · {user?.is_superuser ? "Superuser" : "Staff"}
        </p>
      </Panel>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 disabled:opacity-50"
      />
    </label>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? "bg-blue-600" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
