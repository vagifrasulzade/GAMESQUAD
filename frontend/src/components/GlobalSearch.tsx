import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Users, Shield, Megaphone, MessageSquare } from "lucide-react";
import { api } from "../lib/api";
import type { Clan, Game, Recruitment, Team, User } from "../lib/types";
import { Avatar, GameIcon, Spinner } from "./ui";
import EntityModal from "./EntityModal";

interface Results {
  players: User[];
  teams: Team[];
  clans: Clan[];
  recruitments: Recruitment[];
}

const EMPTY: Results = { players: [], teams: [], clans: [], recruitments: [] };

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{ kind: "team" | "clan"; id: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced multi-entity search.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const params = { params: { search: q } };
      const [players, teams, clans, recruitments] = await Promise.all([
        api.get("/users/", { params: { search: q, exclude_self: 1 } }).then((r) => r.data.results),
        api.get("/teams/", params).then((r) => r.data.results),
        api.get("/clans/", params).then((r) => r.data.results),
        api.get("/recruitments/", params).then((r) => r.data.results),
      ]).catch(() => [[], [], [], []]);
      setResults({
        players: players.slice(0, 5),
        teams: teams.slice(0, 5),
        clans: clans.slice(0, 5),
        recruitments: recruitments.slice(0, 5),
      });
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function reset() {
    setQuery("");
    setResults(EMPTY);
    setOpen(false);
  }

  function message(u: User) {
    reset();
    navigate("/messages", { state: { startUserId: u.id } });
  }

  async function apply(r: Recruitment) {
    try {
      await api.post(`/recruitments/${r.id}/apply/`, { message: "I'd like to join!" });
    } catch {
      /* already applied */
    }
    setApplied((s) => new Set(s).add(r.id));
  }

  const total =
    results.players.length +
    results.teams.length +
    results.clans.length +
    results.recruitments.length;
  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={boxRef} className="relative flex-1 max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search for players, teams, clans..."
        className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-9 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      {query && (
        <button
          onClick={reset}
          aria-label="Clear"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-card shadow-2xl">
          {loading ? (
            <Spinner />
          ) : total === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No results for “{query}”.</p>
          ) : (
            <div className="py-2">
              {/* Players */}
              <Section icon={<Users className="h-3.5 w-3.5" />} label="Players" count={results.players.length}>
                {results.players.map((u) => (
                  <ResultRow
                    key={`u${u.id}`}
                    left={<Avatar src={u.avatar} alt={u.username} size={34} online={u.is_online} />}
                    title={u.display_tag || u.username}
                    subtitle={`@${u.username}`}
                    action={
                      <Action onClick={() => message(u)}>
                        <MessageSquare className="h-3.5 w-3.5" /> Message
                      </Action>
                    }
                  />
                ))}
              </Section>

              {/* Teams */}
              <Section icon={<Users className="h-3.5 w-3.5" />} label="Teams" count={results.teams.length}>
                {results.teams.map((t) => (
                  <ResultRow
                    key={`t${t.id}`}
                    onClick={() => setModal({ kind: "team", id: t.id })}
                    left={<Avatar src={t.logo} alt={t.name} size={34} />}
                    title={t.name}
                    subtitle={t.game?.name}
                    icon={t.game && <GameIcon game={t.game} size={13} />}
                    action={<Action onClick={() => setModal({ kind: "team", id: t.id })}>View · Join</Action>}
                  />
                ))}
              </Section>

              {/* Clans */}
              <Section icon={<Shield className="h-3.5 w-3.5" />} label="Clans" count={results.clans.length}>
                {results.clans.map((c) => (
                  <ResultRow
                    key={`c${c.id}`}
                    onClick={() => setModal({ kind: "clan", id: c.id })}
                    left={<Avatar src={c.logo} alt={c.name} size={34} />}
                    title={c.name}
                    subtitle={c.games?.map((g: Game) => g.name).join(", ")}
                    icon={c.games?.[0] && <GameIcon game={c.games[0]} size={13} />}
                    action={<Action onClick={() => setModal({ kind: "clan", id: c.id })}>View · Join</Action>}
                  />
                ))}
              </Section>

              {/* Recruitments */}
              <Section
                icon={<Megaphone className="h-3.5 w-3.5" />}
                label="Recruitments"
                count={results.recruitments.length}
              >
                {results.recruitments.map((r) => (
                  <ResultRow
                    key={`r${r.id}`}
                    left={
                      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand/15 text-brand-2">
                        <Megaphone className="h-4 w-4" />
                      </span>
                    }
                    title={r.title}
                    subtitle={r.game?.name}
                    icon={r.game && <GameIcon game={r.game} size={13} />}
                    action={
                      <Action onClick={() => apply(r)} disabled={applied.has(r.id)}>
                        {applied.has(r.id) ? "Applied ✓" : "Apply"}
                      </Action>
                    }
                  />
                ))}
              </Section>
            </div>
          )}
        </div>
      )}

      {modal && (
        <EntityModal
          kind={modal.kind}
          id={modal.id}
          onClose={() => {
            setModal(null);
            reset();
          }}
        />
      )}
    </div>
  );
}

function Section({
  icon,
  label,
  count,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  left,
  title,
  subtitle,
  icon,
  action,
  onClick,
}: {
  left: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 ${onClick ? "cursor-pointer hover:bg-card2" : "hover:bg-card2"}`}
    >
      {left}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted">
          {icon}
          {subtitle || "—"}
        </p>
      </div>
      <div onClick={(e) => e.stopPropagation()}>{action}</div>
    </div>
  );
}

function Action({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-brand hover:text-white disabled:opacity-60"
    >
      {children}
    </button>
  );
}
