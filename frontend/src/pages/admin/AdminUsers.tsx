import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { api, fetchAll } from "../../lib/api";
import type { User } from "../../lib/types";
import { useAuth } from "../../context/AuthContext";
import { generateUsername } from "../../lib/username";
import {
  AdminButton,
  AdminHeader,
  AdminModal,
  Avatar2,
  CheckField,
  Cell,
  ImageUploadField,
  NewButton,
  Panel,
  Pill,
  Pagination,
  Row,
  RowActions,
  REGION_OPTIONS,
  SelectField,
  Table,
  TextField,
  usePagination,
} from "./adminUi";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<User | "new" | null>(null);

  function load() {
    setLoading(true);
    fetchAll<User>("/users/")
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(
    () => users.filter((u) => u.username.toLowerCase().includes(q.toLowerCase())),
    [users, q]
  );
  const { page, setPage, pageCount, pageItems, total } = usePagination(filtered);

  async function remove(u: User) {
    if (u.id === me?.id) {
      alert("You can't delete your own account while signed in.");
      return;
    }
    if (!confirm(`Delete ${u.username}? This cannot be undone.`)) return;
    await api.delete(`/users/${u.id}/`);
    load();
  }

  return (
    <div className="animate-fade-in">
      <AdminHeader
        title="Users"
        subtitle={`${users.length} registered gamers`}
        action={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users…"
                className="rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <NewButton label="Add user" onClick={() => setEditing("new")} />
          </div>
        }
      />

      <Panel>
        <Table
          columns={["User", "Email", "Region", "Playstyle", "Games", "Role", "Status", ""]}
          loading={loading}
          empty={filtered.length === 0}
        >
          {pageItems.map((u) => (
            <Row key={u.id}>
              <Cell>
                <div className="flex items-center gap-2.5">
                  <Avatar2 name={u.username} />
                  <span className="font-medium text-white">{u.username}</span>
                </div>
              </Cell>
              <Cell>{u.email || "—"}</Cell>
              <Cell>{u.region || "—"}</Cell>
              <Cell className="capitalize">{u.playstyle}</Cell>
              <Cell>{u.game_accounts.map((g) => g.game.name).join(", ") || "—"}</Cell>
              <Cell>
                {u.is_superuser ? (
                  <Pill tone="red">Superuser</Pill>
                ) : u.is_staff ? (
                  <Pill tone="blue">Staff</Pill>
                ) : (
                  <Pill tone="slate">Member</Pill>
                )}
              </Cell>
              <Cell>
                <Pill tone={u.is_online ? "green" : "slate"}>{u.is_online ? "Online" : "Offline"}</Pill>
              </Cell>
              <Cell>
                <RowActions onEdit={() => setEditing(u)} onDelete={() => remove(u)} />
              </Cell>
            </Row>
          ))}
        </Table>
        <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
      </Panel>

      {editing && (
        <UserForm
          user={editing === "new" ? null : editing}
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

function UserForm({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [region, setRegion] = useState(user?.region ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [playstyle, setPlaystyle] = useState(user?.playstyle ?? "competitive");
  const [lookingFor, setLookingFor] = useState(user?.looking_for ?? "any");
  const [verified, setVerified] = useState(user?.verified ?? false);
  const [isStaff, setIsStaff] = useState(user?.is_staff ?? false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadAvatar(file: File) {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.post("/users/upload-avatar/", form);
    return data.avatar as string;
  }

  async function save() {
    setBusy(true);
    setError("");
    const payload: Record<string, unknown> = {
      username,
      email,
      avatar,
      region,
      country,
      playstyle,
      looking_for: lookingFor,
      verified,
      is_staff: isStaff,
    };
    if (password) payload.password = password;
    try {
      if (user) await api.patch(`/users/${user.id}/`, payload);
      else await api.post("/users/", payload);
      onSaved();
    } catch {
      setError("Couldn't save the user. A new user needs a unique username and a password (min 6 chars).");
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={user ? `Edit ${user.username}` : "Add user"}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={busy || !username.trim()}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <ImageUploadField
          label="Avatar"
          value={avatar}
          onChange={setAvatar}
          onUpload={uploadAvatar}
          previewAlt={username || "User"}
          previewClassName="h-20 w-20 rounded-full"
          showUrlInput={false}
        />
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <TextField label="Username" value={username} onChange={setUsername} />
          <AdminButton
            type="button"
            variant="ghost"
            className="mt-5 min-w-0 px-3"
            onClick={() => setUsername(generateUsername({ withNumber: true, separator: "" }).toLowerCase())}
            title="Generate username"
            aria-label="Generate username"
          >
            <RefreshCw className="h-4 w-4" />
          </AdminButton>
        </div>
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Region" value={region} onChange={setRegion} options={REGION_OPTIONS} />
          <TextField label="Country" value={country} onChange={setCountry} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Playstyle"
            value={playstyle}
            onChange={setPlaystyle}
            options={[
              { value: "competitive", label: "Competitive" },
              { value: "casual", label: "Casual" },
            ]}
          />
          <SelectField
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
        <TextField
          label={user ? "Reset password (leave blank to keep)" : "Password"}
          value={password}
          onChange={setPassword}
          type="password"
        />
        <div className="flex items-center gap-6 pt-1">
          <CheckField label="Verified" checked={verified} onChange={setVerified} />
          <CheckField label="Staff (admin access)" checked={isStaff} onChange={setIsStaff} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </AdminModal>
  );
}
