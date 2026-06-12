import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Brain,
  Check,
  Send,
  Gamepad2,
  Compass,
  Trophy,
  Clock,
  Languages,
  Crosshair,
  Trash2,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { MatchCard } from "../lib/types";
import { Avatar, Badge, Button, Card, GameIcon, ProgressBar, Spinner, Verified } from "../components/ui";
import EntityModal from "../components/EntityModal";

const TABS = ["all", "teams", "clans"] as const;
type Tab = (typeof TABS)[number];

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export default function Matches() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<{ kind: "team" | "clan"; id: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/matches/", { params: { type: tab } })
      .then((r) => {
        setMatches(r.data.results);
        setAiEnabled(r.data.ai_enabled);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="animate-fade-in grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-brand/30 via-panel to-base p-7">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">AI Matches</h1>
            <Badge tone="brand">BETA</Badge>
          </div>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Our AI finds the best teams and clans for you based on your skills, playstyle and
            goals.
          </p>
          <Brain className="absolute right-6 top-6 h-16 w-16 text-brand-2/40" />
          {!aiEnabled && (
            <p className="mt-3 text-xs text-warn">
              Running in heuristic mode — add GROQ_API_KEY or OPENROUTER_API_KEY for LLM-written
              insights.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm capitalize transition ${
                tab === t
                  ? "border-brand text-white"
                  : "border-transparent text-muted hover:text-white"
              }`}
            >
              {t === "all" ? "Best Matches" : t}
            </button>
          ))}
        </div>

        {/* Preferences */}
        <Card className="p-5">
          <p className="mb-4 text-sm font-semibold text-muted">Your Preferences</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Pref icon={<Gamepad2 />} label="Games" value={user?.game_accounts.map((g) => g.game.name).join(", ") || "—"} />
            <Pref icon={<Compass />} label="Roles" value={user?.main_roles.join(", ") || "—"} />
            <Pref icon={<Trophy />} label="Playstyle" value={user?.playstyle || "—"} />
            <Pref icon={<Clock />} label="Availability" value={user?.availability_days.join(", ") || "—"} />
            <Pref icon={<Languages />} label="Language" value={user?.languages.join(", ") || "—"} />
          </div>
        </Card>

        {/* Match list */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Top AI Matches for You</h2>
          <Sparkles className="h-4 w-4 text-brand-2" />
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="space-y-4">
            {matches.map((m) => (
              <MatchRow
                key={`${m.kind}-${m.id}`}
                match={m}
                onView={() => setView({ kind: m.kind, id: m.id })}
              />
            ))}
            {matches.length === 0 && (
              <Card className="p-8 text-center text-muted">No matches found.</Card>
            )}
          </div>
        )}
      </div>

      <AssistantPanel topName={matches[0]?.name} />

      {view && (
        <EntityModal kind={view.kind} id={view.id} onClose={() => setView(null)} />
      )}
    </div>
  );
}

function Pref({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-brand-2">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate text-sm font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}

function MatchRow({ match, onView }: { match: MatchCard; onView: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Identity */}
        <div className="flex gap-4 lg:w-64">
          <Avatar src={match.logo} alt={match.name} size={56} />
          <div>
            <Badge tone="brand">{match.kind.toUpperCase()}</Badge>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="font-semibold">{match.name}</span>
              {match.verified && <Verified />}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-muted">
              {match.games?.slice(0, 3).map((g) => (
                <GameIcon key={g.id} game={g} size={14} />
              ))}
              {match.playstyle} · {match.game ?? (match.games?.length ? "Multiple Games" : "—")}
            </p>
            <p className="mt-2 line-clamp-2 text-xs text-muted">{match.description}</p>
          </div>
        </div>

        {/* Compatibility */}
        <div className="flex flex-col items-center justify-center lg:w-28">
          <p className="text-xs text-muted">AI Compatibility</p>
          <p className="text-3xl font-bold text-good">{match.compatibility}%</p>
          <Crosshair className="mt-1 h-4 w-4 text-good" />
        </div>

        {/* Reasons */}
        <div className="flex-1">
          <p className="mb-2 text-sm font-medium">Why it's a great match</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {match.reasons.map((r) => (
              <li key={r} className="flex items-center gap-2 text-sm text-muted">
                <Check className="h-4 w-4 shrink-0 text-good" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 lg:w-32 lg:justify-center">
          <Button variant={match.kind === "clan" ? "good" : "primary"} onClick={onView}>
            View {match.kind === "clan" ? "Clan" : "Team"}
          </Button>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-4 grid gap-x-6 gap-y-2 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(match.breakdown).map(([k, v]) => (
          <div key={k}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted">{k}</span>
              <span className="font-medium">{v}%</span>
            </div>
            <ProgressBar value={v} />
          </div>
        ))}
      </div>
    </Card>
  );
}

const GREETING: ChatMsg = {
  role: "assistant",
  content:
    "Hi! 👋 I analyzed your profile and found some great opportunities for you. Ask me anything about your matches.",
};

function AssistantPanel({ topName }: { topName?: string }) {
  const { user } = useAuth();
  const storageKey = `gs_assistant_chat_${user?.id ?? "anon"}`;

  // Restore the saved conversation so it survives reloads/restarts.
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try {
      const raw = localStorage.getItem(`gs_assistant_chat_${user?.id ?? "anon"}`);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed as ChatMsg[];
    } catch {
      /* ignore malformed storage */
    }
    return [GREETING];
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* storage full or unavailable */
    }
  }, [messages, storageKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function clearChat() {
    setMessages([GREETING]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const history = messages;
    setMessages([...history, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const { data } = await api.post("/matches/assistant/", { message: text, history });
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't reach the AI service." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = ["Show me more teams", "Find clans instead", "What can I improve?"];

  return (
    <Card className="sticky top-0 flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Sparkles className="h-5 w-5 text-brand-2" />
        <span className="font-semibold">AI Assistant</span>
        <Badge tone="brand">BETA</Badge>
        {messages.length > 1 && (
          <button
            onClick={clearChat}
            title="Clear chat"
            className="ml-auto rounded-lg p-1.5 text-muted transition hover:bg-card2 hover:text-warn"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-brand text-white"
                : "bg-card2 text-gray-200"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="text-xs text-muted">Assistant is typing…</div>}
        {topName && messages.length <= 1 && (
          <div className="rounded-xl border border-line bg-card2 p-3 text-xs text-muted">
            Tip: your top match is <span className="text-white">{topName}</span>. Ask "why is it a
            good fit?"
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t border-line p-3">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:border-brand hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <Button type="submit" disabled={busy} className="px-3">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-muted">AI can make mistakes. Check important info.</p>
      </div>
    </Card>
  );
}
