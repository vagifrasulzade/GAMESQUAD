import { useEffect, useRef, useState } from "react";
import { Trophy, Crosshair, Swords, MapPin, Clock, Pencil, Globe, X, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Game, GameAccount } from "../lib/types";
import { COUNTRIES, LANGUAGES, REGIONS, STATUSES, statusMeta } from "../lib/locations";
import { Avatar, Badge, Button, Card, GameIcon, Modal, PageHeader, Verified } from "../components/ui";

function formatTimeWithPeriod(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minutes} ${period}`;
}

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Profile"
        action={
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit Profile
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="h-28 bg-linear-to-r from-brand/40 via-panel to-base" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="-mt-10">
            <button
              type="button"
              onClick={() => setEditingAvatar(true)}
              className="cursor-pointer hover:opacity-80 transition"
            >
              <Avatar src={user.avatar} alt={user.username} size={88} />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{user.full_name || user.username}</h2>
              {user.verified && <Verified />}
            </div>
            {user.full_name && <p className="text-sm text-muted">@{user.username}</p>}
            <div className="mt-0.5 flex items-center gap-1.5 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: statusMeta(user.status).color }}
              />
              <span className="text-muted">{statusMeta(user.status).label}</span>
            </div>
            <p className="text-sm capitalize text-muted">
              {user.playstyle} player · looking for {user.looking_for}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.country && (
              <Badge>
                <Globe className="h-3 w-3" /> {user.country}
              </Badge>
            )}
            {user.region && (
              <Badge>
                <MapPin className="h-3 w-3" /> {user.region}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase text-muted">Game Accounts</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {user.game_accounts.map((ga) => (
                <div key={ga.id} className="flex items-center justify-between rounded-lg bg-card2 p-3">
                  <div className="flex items-center gap-2.5">
                    <GameIcon game={ga.game} size={28} />
                    <div>
                      <p className="font-medium" style={{ color: ga.game.color }}>
                        {ga.game.name}
                      </p>
                      <p className="text-xs text-muted">{ga.in_game_name || user.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{ga.rank}</p>
                    <p className="text-xs text-muted">{ga.role}</p>
                  </div>
                </div>
              ))}
              {user.game_accounts.length === 0 && (
                <p className="text-sm text-muted">No game accounts connected.</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase text-muted">About</h3>
            <p className="text-sm text-muted">{user.bio || "No bio yet."}</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="grid grid-cols-3 gap-2 p-5 text-center">
            <Stat icon={<Trophy className="h-4 w-4" />} label="Wins" value={user.wins} />
            <Stat icon={<Crosshair className="h-4 w-4" />} label="K/D" value={user.kd} />
            <Stat icon={<Swords className="h-4 w-4" />} label="Matches" value={user.matches} />
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase text-muted">Roles</h3>
            <div className="flex flex-wrap gap-2">
              {user.main_roles.map((r) => (
                <Badge key={r} tone="brand">
                  {r}
                </Badge>
              ))}
              {user.main_roles.length === 0 && <p className="text-sm text-muted">—</p>}
            </div>
            <h3 className="mb-3 mt-4 text-sm font-semibold uppercase text-muted">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {user.languages.map((l) => (
                <Badge key={l}>{l}</Badge>
              ))}
              {user.languages.length === 0 && <p className="text-sm text-muted">—</p>}
            </div>
            <h3 className="mb-3 mt-4 text-sm font-semibold uppercase text-muted">Availability</h3>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock className="h-4 w-4" />
              {user.availability_days.join(", ") || "—"} · {formatTimeWithPeriod(user.availability_from) || "—"}–
              {formatTimeWithPeriod(user.availability_to) || "—"}
            </div>
          </Card>
        </div>
      </div>

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
      {editingAvatar && <AvatarEditModal onClose={() => setEditingAvatar(false)} />}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card2 py-3">
      <div className="flex justify-center text-brand-2">{icon}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [region, setRegion] = useState(user?.region ?? "");
  const [playstyle, setPlaystyle] = useState(user?.playstyle ?? "competitive");
  const [lookingFor, setLookingFor] = useState(user?.looking_for ?? "any");
  const [status, setStatus] = useState(user?.status ?? "online");
  const [languages, setLanguages] = useState<string[]>(user?.languages ?? []);
  const [roles, setRoles] = useState((user?.main_roles ?? []).join(", "));
  const [days, setDays] = useState<string[]>(user?.availability_days ?? []);
  const [from, setFrom] = useState(user?.availability_from ?? "");
  const [to, setTo] = useState(user?.availability_to ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function toggleDay(day: string) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAvatarError("");
    try {
      const form = new FormData();
      form.append("avatar", file);
      const response = await api.post("/users/me/avatar/", form);
      const newAvatarUrl = response.data?.avatar;
      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        await refreshUser();
      } else {
        setAvatarError("Upload succeeded but no avatar URL was returned.");
      }
    } catch (err: any) {
      setAvatarError(err?.response?.data?.detail || "Couldn't upload that image. Please try a different file.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch("/users/me/", {
        username,
        full_name: fullName,
        bio,
        country,
        region,
        playstyle,
        looking_for: lookingFor,
        status,
        languages,
        main_roles: roles.split(",").map((s) => s.trim()).filter(Boolean),
        availability_days: DAYS.filter((d) => days.includes(d)),
        availability_from: from,
        availability_to: to,
      });
      await refreshUser();
      onClose();
    } catch {
      setError("Couldn't save your changes. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose}>
      <form onSubmit={save} className="p-6">
        <h2 className="mb-1 text-xl font-bold">Edit Profile</h2>
        <p className="mb-5 text-sm text-muted">Update your public profile and matchmaking preferences.</p>

        <div className="mb-5 flex justify-center">
          <div className="relative">
            <Avatar src={avatar} alt={user?.username ?? "U"} size={96} />
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              aria-label="Upload image"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-brand text-white shadow-lg transition hover:bg-brand/90 disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 text-xs font-medium text-white">
                Uploading...
              </span>
            )}
          </div>
        </div>
        {avatarError && <p className="mb-4 text-sm text-warn">{avatarError}</p>}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            value={fullName}
            onChange={setFullName}
            placeholder="e.g. Huseyn Sadatkhanov"
          />
          <Field label="Username" value={username} onChange={setUsername} />
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <Select
            label="Region"
            value={region}
            onChange={setRegion}
            options={REGIONS.map((r) => ({ value: r, label: r }))}
            placeholder="Select a region"
          />
          <Select
            label="Country"
            value={country}
            onChange={setCountry}
            options={COUNTRIES.map((c) => ({ value: c, label: c }))}
            placeholder="Select a country"
          />
          <Select
            label="Playstyle"
            value={playstyle}
            onChange={setPlaystyle}
            options={[
              { value: "competitive", label: "Competitive" },
              { value: "casual", label: "Casual" },
            ]}
          />
          <Select
            label="Looking for"
            value={lookingFor}
            onChange={setLookingFor}
            options={[
              { value: "any", label: "Any" },
              { value: "team", label: "Team" },
              { value: "clan", label: "Clan" },
              { value: "players", label: "Players" },
            ]}
          />
        </div>

        <div className="mt-4">
          <Field label="Bio" value={bio} onChange={setBio} textarea />
        </div>

        <div className="mt-4">
          <GameAccountsEditor />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MultiSelect
            label="Languages"
            selected={languages}
            onChange={setLanguages}
            options={LANGUAGES as readonly string[]}
            placeholder="Add a language"
          />
          <Field label="Main roles (comma separated)" value={roles} onChange={setRoles} />
        </div>

        <div className="mt-4">
          <span className="mb-1.5 block text-sm text-muted">Available days</span>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-brand/30 bg-brand/15 text-brand-2"
                      : "border-line bg-card2 text-muted hover:text-white"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TimeSelect label="Available from" value={from} onChange={setFrom} />
          <TimeSelect label="Available to" value={to} onChange={setTo} />
        </div>

        {error && <p className="mt-4 text-sm text-warn">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type GameField = "in_game_name" | "rank" | "role";

/** Live editor for the games on the signed-in user's profile. Adds, edits
 *  (on blur) and removes hit `/game-accounts/` immediately. */
function GameAccountsEditor() {
  const { user, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState<GameAccount[]>(user?.game_accounts ?? []);
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/games/")
      .then((r) => setGames(r.data.results ?? r.data))
      .catch(() => {});
  }, []);

  const usedIds = new Set(accounts.map((a) => a.game.id));
  const available = games.filter((g) => !usedIds.has(g.id));

  async function addGame(gameId: number) {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/game-accounts/", { game_id: gameId });
      setAccounts((prev) => [...prev, data]);
      await refreshUser();
    } catch (e: any) {
      setError(e?.response?.data?.game_id?.[0] ?? "Couldn't add that game.");
    } finally {
      setBusy(false);
    }
  }

  async function patchField(acc: GameAccount, field: GameField, value: string) {
    if (value === acc[field]) return;
    setError("");
    try {
      const { data } = await api.patch(`/game-accounts/${acc.id}/`, { [field]: value });
      setAccounts((prev) => prev.map((a) => (a.id === acc.id ? data : a)));
      await refreshUser();
    } catch {
      setError("Couldn't save that change.");
    }
  }

  async function remove(id: number) {
    setError("");
    try {
      await api.delete(`/game-accounts/${id}/`);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      await refreshUser();
    } catch {
      setError("Couldn't remove that game.");
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm text-muted">Game accounts</span>
      <div className="space-y-2">
        {accounts.map((a) => (
          <div key={a.id} className="rounded-lg border border-line bg-card2 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GameIcon game={a.game} size={20} />
                <span className="text-sm font-medium">{a.game.name}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label={`Remove ${a.game.name}`}
                className="rounded-md p-1 text-muted transition hover:bg-card hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <GameAccountField acc={a} field="in_game_name" placeholder="In-game name" onSave={patchField} />
              <GameAccountField acc={a} field="rank" placeholder="Rank" onSave={patchField} />
              <GameAccountField acc={a} field="role" placeholder="Role" onSave={patchField} />
            </div>
          </div>
        ))}
        {accounts.length === 0 && <p className="text-sm text-muted">No games yet. Add one below.</p>}
      </div>

      {available.length > 0 && (
        <select
          value=""
          disabled={busy}
          onChange={(e) => {
            if (e.target.value) addGame(Number(e.target.value));
          }}
          className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">+ Add a game…</option>
          {available.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}
      {error && <p className="mt-2 text-sm text-warn">{error}</p>}
    </div>
  );
}

function GameAccountField({
  acc,
  field,
  placeholder,
  onSave,
}: {
  acc: GameAccount;
  field: GameField;
  placeholder: string;
  onSave: (acc: GameAccount, field: GameField, value: string) => void;
}) {
  return (
    <input
      defaultValue={acc[field]}
      placeholder={placeholder}
      onBlur={(e) => onSave(acc, field, e.target.value)}
      className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm outline-none focus:border-brand"
    />
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
        />
      )}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  // Keep an unknown saved value selectable so it isn't silently dropped.
  const all =
    value && !options.some((o) => o.value === value)
      ? [{ value, label: value }, ...options]
      : options;
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {all.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Pick several values from a list: a dropdown to add, removable chips below. */
function MultiSelect({
  label,
  selected,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  selected: string[];
  onChange: (v: string[]) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  const available = options.filter((o) => !selected.includes(o));
  return (
    <div>
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onChange([...selected, e.target.value]);
        }}
        className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
      >
        <option value="">{placeholder ?? "Add…"}</option>
        {available.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-card2 px-2 py-0.5 text-xs"
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(selected.filter((x) => x !== s))}
                aria-label={`Remove ${s}`}
                className="text-muted transition hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AvatarEditModal({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useAuth();
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("avatar", file);
      const response = await api.post("/users/me/avatar/", form);
      const newAvatarUrl = response.data?.avatar;
      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        await refreshUser();
        onClose();
      } else {
        setError("Upload succeeded but no avatar URL was returned.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Couldn't upload that image. Please try a different file.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function saveUrl() {
    if (!avatar) {
      setError("Please enter a valid URL");
      return;
    }
    setUploading(true);
    setError("");
    try {
      await api.patch("/users/me/", { avatar });
      await refreshUser();
      onClose();
    } catch {
      setError("Couldn't save that URL. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-1 text-xl font-bold">Update Avatar</h2>
        <p className="mb-5 text-sm text-muted">Upload a new image or paste an avatar URL.</p>

        <div className="space-y-4">
          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              className="hidden"
            />
            <Button
              type="button"
              variant="primary"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload image"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted">or</span>
            </div>
          </div>

          <div>
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          {error && <p className="text-sm text-warn">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" disabled={uploading || !avatar} onClick={saveUrl}>
              {uploading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = ["00", "15", "30", "45"];

  const [selectedHour, selectedMinute] = value.split(":").length === 2 ? value.split(":") : ["00", "00"];
  const isPM = parseInt(selectedHour) >= 12;

  return (
    <div className="relative">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{label}</span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand hover:border-brand/50 transition"
        >
          <span className="font-medium">
            {value ? `${selectedHour}:${selectedMinute} ${isPM ? "PM" : "AM"}` : "Select time"}
          </span>
          <span className="text-xs text-muted">▼</span>
        </button>
      </label>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-line bg-card shadow-lg z-50">
          <div className="grid grid-cols-3 gap-1 p-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted text-center mb-2">Hour</div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      onChange(`${String(h).padStart(2, "0")}:${selectedMinute}`);
                    }}
                    className={`w-full rounded px-2 py-1.5 text-sm transition ${
                      parseInt(selectedHour) === h
                        ? "bg-brand text-white"
                        : "hover:bg-card2 text-muted hover:text-white"
                    }`}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted text-center mb-2">Minute</div>
              <div className="space-y-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onChange(`${selectedHour}:${m}`);
                    }}
                    className={`w-full rounded px-2 py-1.5 text-sm transition ${
                      selectedMinute === m
                        ? "bg-brand text-white"
                        : "hover:bg-card2 text-muted hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted text-center mb-2">Period</div>
              <div className="space-y-1">
                {["AM", "PM"].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      let h = parseInt(selectedHour);
                      if (period === "PM" && h < 12) h += 12;
                      if (period === "AM" && h >= 12) h -= 12;
                      onChange(`${String(h).padStart(2, "0")}:${selectedMinute}`);
                    }}
                    className={`w-full rounded px-2 py-1.5 text-sm transition ${
                      isPM === (period === "PM")
                        ? "bg-brand text-white"
                        : "hover:bg-card2 text-muted hover:text-white"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full border-t border-line px-3 py-2 text-sm text-muted hover:text-white transition"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
