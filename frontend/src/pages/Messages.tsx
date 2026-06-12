import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Send, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Avatar, Button, Card, PageHeader, Spinner } from "../components/ui";

interface UserHit {
  id: number;
  username: string;
  display_tag?: string;
  full_name?: string;
  avatar: string;
  is_online: boolean;
}

interface Msg {
  id: number;
  sender: { id: number; username: string; display_tag?: string; avatar: string };
  body: string;
  created_at: string;
}
interface Conv {
  id: number;
  participants: { id: number; username: string; display_tag?: string; avatar: string; is_online: boolean }[];
  last_message: Msg | null;
}

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get("/conversations/")
      .then((r) => {
        setConvs(r.data.results);
        if (r.data.results.length) selectConv(r.data.results[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Debounced username search for starting new conversations.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      api
        .get("/users/", { params: { search: q, exclude_self: 1 } })
        .then((r) => setResults(r.data.results))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => endRef.current?.scrollIntoView(), [messages]);

  // Opened from global search ("Message" action) — auto-start that conversation.
  useEffect(() => {
    const uid = (location.state as { startUserId?: number } | null)?.startUserId;
    if (uid) startConv(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  async function startConv(userId: number) {
    const { data } = await api.post("/conversations/start/", { user_id: userId });
    setConvs((list) => (list.some((c) => c.id === data.id) ? list : [data, ...list]));
    setQuery("");
    setResults([]);
    selectConv(data);
  }

  async function selectConv(c: Conv) {
    setActive(c);
    const { data } = await api.get(`/conversations/${c.id}/messages/`);
    setMessages(data);
  }

  async function deleteConv(c: Conv) {
    if (!confirm("Delete this conversation? This removes the chat and its messages for you.")) return;
    await api.delete(`/conversations/${c.id}/`);
    setConvs((list) => list.filter((x) => x.id !== c.id));
    if (active?.id === c.id) {
      setActive(null);
      setMessages([]);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !active) return;
    const { data } = await api.post(`/conversations/${active.id}/messages/`, { body: input });
    setMessages((m) => [...m, data]);
    setInput("");
  }

  function other(c: Conv) {
    return c.participants.find((p) => p.id !== user?.id) ?? c.participants[0];
  }

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Messages" />
      <Card className="grid h-[calc(100vh-12rem)] grid-cols-[280px_1fr] overflow-hidden">
        {/* Conversation list */}
        <div className="border-r border-line overflow-y-auto">
          {/* Username search */}
          <div className="sticky top-0 z-10 border-b border-line bg-card p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search players by username..."
                className="w-full rounded-lg border border-line bg-base py-2 pl-8 pr-8 text-sm outline-none focus:border-brand"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search results take over the list while typing */}
          {query.trim() ? (
            <div>
              {searching && <p className="p-4 text-sm text-muted">Searching…</p>}
              {!searching &&
                results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startConv(u.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-card2"
                  >
                    <Avatar src={u.avatar} alt={u.username} size={40} online={u.is_online} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.full_name || u.username}</p>
                      <p className="truncate text-xs text-muted">@{u.username}</p>
                    </div>
                  </button>
                ))}
              {!searching && results.length === 0 && (
                <p className="p-4 text-sm text-muted">No players found.</p>
              )}
            </div>
          ) : (
            <>
          {convs.map((c) => {
            const o = other(c);
            return (
              <div
                key={c.id}
                className={`group relative flex w-full items-center transition hover:bg-card2 ${
                  active?.id === c.id ? "bg-card2" : ""
                }`}
              >
                <button
                  onClick={() => selectConv(c)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                >
                  <Avatar src={o?.avatar} alt={o?.username ?? "U"} size={40} online={o?.is_online} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o?.username}</p>
                    <p className="truncate text-xs text-muted">{c.last_message?.body ?? "No messages yet"}</p>
                  </div>
                </button>
                <button
                  onClick={() => deleteConv(c)}
                  aria-label={`Delete conversation with ${o?.username ?? "user"}`}
                  title="Delete conversation"
                  className="mr-2 shrink-0 rounded-md p-1.5 text-muted opacity-0 transition hover:bg-base hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {convs.length === 0 && (
            <p className="p-4 text-sm text-muted">No conversations yet.</p>
          )}
            </>
          )}
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-5 py-3">
                <Avatar src={other(active)?.avatar} alt={other(active)?.username ?? "U"} size={36} />
                <span className="font-medium">{other(active)?.username}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-5">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`w-fit max-w-70 wrap-break-word rounded-xl px-3 py-2 text-sm ${
                      m.sender.id === user?.id ? "ml-auto bg-brand text-white" : "bg-card2"
                    }`}
                  >
                    {m.body}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <Button type="submit" className="px-3">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted">
              Select a conversation
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
