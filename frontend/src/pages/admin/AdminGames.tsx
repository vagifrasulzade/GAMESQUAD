import { useEffect, useState } from "react";
import { Search, Trash2, Pencil } from "lucide-react";
import { api, fetchAll } from "../../lib/api";
import type { Game } from "../../lib/types";
import {
  AdminButton,
  AdminHeader,
  AdminModal,
  CheckField,
  NewButton,
  Pagination,
  Pill,
  TextField,
  usePagination,
} from "./adminUi";

export default function AdminGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Game | "new" | null>(null);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    fetchAll<Game>("/games/")
      .then(setGames)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove(g: Game) {
    if (!confirm(`Delete "${g.name}"? This cannot be undone.`)) return;
    await api.delete(`/games/${g.id}/`);
    load();
  }

  const filtered = games.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.slug.toLowerCase().includes(search.toLowerCase())
  );
  const { page, setPage, pageCount, pageItems, total } = usePagination(filtered);

  return (
    <div className="animate-fade-in">
      <AdminHeader
        title="Games"
        subtitle={`${games.length} supported titles${search ? ` • ${filtered.length} matching` : ""}`}
        action={<NewButton label="Add game" onClick={() => setEditing("new")} />}
      />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 py-16">
          <p className="text-slate-500">Loading games...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 py-16">
          <p className="text-slate-500">{search ? "No games found" : "No games added yet"}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                onEdit={() => setEditing(g)}
                onDelete={() => remove(g)}
              />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
              <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
            </div>
          )}
        </>
      )}

      {editing && (
        <GameForm
          game={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function GameCard({
  game,
  onEdit,
  onDelete,
}: {
  game: Game;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-5 transition hover:border-slate-600 hover:shadow-lg">
      {/* Background accent */}
      <div
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10"
        style={{ backgroundColor: game.color }}
      />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Header with Logo and Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/50">
              {game.icon ? (
                <img src={game.icon} alt={game.name} className="h-10 w-10 rounded object-contain" />
              ) : (
                <div
                  className="h-10 w-10 rounded"
                  style={{ backgroundColor: game.color }}
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">{game.name}</h3>
              <p className="text-xs text-slate-400">{game.slug}</p>
            </div>
          </div>
          <Pill tone={game.is_active ? "green" : "slate"}>
            {game.is_active ? "Active" : "Hidden"}
          </Pill>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-800/30 p-2.5">
            <p className="text-xs text-slate-400">Roles</p>
            <p className="text-lg font-semibold text-white">{game.roles.length}</p>
          </div>
          <div className="rounded-lg bg-slate-800/30 p-2.5">
            <p className="text-xs text-slate-400">Ranks</p>
            <p className="text-lg font-semibold text-white">{game.ranks.length}</p>
          </div>
        </div>

        {/* Role Tags */}
        {game.roles.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-slate-400">Top Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {game.roles.slice(0, 3).map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300"
                >
                  {role}
                </span>
              ))}
              {game.roles.length > 3 && (
                <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
                  +{game.roles.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t border-slate-700/50 pt-3">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600/20 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-600/30"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600/20 py-2 text-sm font-medium text-red-300 transition hover:bg-red-600/30"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function GameForm({
  game,
  onClose,
  onSaved,
}: {
  game: Game | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(game?.name ?? "");
  const [color] = useState(game?.color ?? "#7c3aed");
  const [icon, setIcon] = useState(game?.icon ?? "");
  const [roles, setRoles] = useState((game?.roles ?? []).join(", "));
  const [ranks, setRanks] = useState((game?.ranks ?? []).join(", "));
  const [isActive, setIsActive] = useState(game?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("image", file);
    try {
      const { data } = await api.post("/games/upload-image/", form);
      setIcon(data.url);
    } catch {
      setError("Couldn't upload the image. Try a smaller PNG/JPG/SVG.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    const payload = {
      name,
      color,
      icon,
      roles: roles.split(",").map((s) => s.trim()).filter(Boolean),
      ranks: ranks.split(",").map((s) => s.trim()).filter(Boolean),
      is_active: isActive,
    };
    try {
      if (game) await api.patch(`/games/${game.id}/`, payload);
      else await api.post("/games/", payload);
      onSaved();
    } catch {
      setError("Couldn't save the game. Check the fields and try again.");
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={game ? "Edit game" : "Add game"}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={busy || !name.trim()}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Basic Info Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Basic Info</h3>
          <TextField label="Game Name" value={name} onChange={setName} placeholder="e.g., Valorant, League of Legends" />
        </div>

        {/* Logo & Branding Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Logo</h3>
          <div className="space-y-4">
            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Preview</span>
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-slate-700 bg-slate-900">
                {icon ? (
                  <img src={icon} alt={name} className="h-20 w-20 rounded object-contain" />
                ) : (
                  <div
                    className="h-20 w-20 rounded"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-600/50 bg-blue-600/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-600/20">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
                disabled={uploading}
              />
              {uploading ? "Uploading…" : "Upload Logo"}
            </label>
          </div>
        </div>

        {/* Game Configuration Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Game Configuration</h3>
          <div className="space-y-4">
            <TextField 
              label="Roles (comma separated)" 
              value={roles} 
              onChange={setRoles}
              placeholder="e.g., Attacker, Defender, Support"
              textarea
            />
            <TextField 
              label="Ranks (comma separated)" 
              value={ranks} 
              onChange={setRanks}
              placeholder="e.g., Iron, Bronze, Silver, Gold"
              textarea
            />
          </div>
        </div>

        {/* Visibility Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Visibility</h3>
          <CheckField label="Active - Show in public catalog" checked={isActive} onChange={setIsActive} />
        </div>

        {/* Error Card */}
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </AdminModal>
  );
}
