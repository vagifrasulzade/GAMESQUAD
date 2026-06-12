import { useEffect, useState } from "react";
import { api, fetchAll } from "../../lib/api";
import type { Clan, Game } from "../../lib/types";
import {
  AdminButton,
  AdminHeader,
  AdminModal,
  Avatar2,
  CheckField,
  Cell,
  FOCUS_OPTIONS,
  ImageUploadField,
  NewButton,
  Pagination,
  Panel,
  Pill,
  Row,
  RowActions,
  REGION_OPTIONS,
  SelectField,
  Table,
  TextField,
  fmtDate,
  usePagination,
} from "./adminUi";
import { GameIcon } from "../../components/ui";

export default function AdminClans() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Clan | "new" | null>(null);

  function load() {
    setLoading(true);
    Promise.all([fetchAll<Clan>("/clans/"), fetchAll<Game>("/games/")])
      .then(([c, g]) => {
        setClans(c);
        setGames(g);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const { page, setPage, pageCount, pageItems, total } = usePagination(clans);

  async function remove(c: Clan) {
    if (!confirm(`Delete clan “${c.name}”? This cannot be undone.`)) return;
    await api.delete(`/clans/${c.id}/`);
    load();
  }

  return (
    <div className="animate-fade-in">
      <AdminHeader
        title="Clans"
        subtitle={`${clans.length} communities`}
        action={<NewButton label="Add clan" onClick={() => setEditing("new")} />}
      />
      <Panel>
        <Table
          columns={["Clan", "Region", "Focus", "Games", "Members", "Owner", "Verified", "Created", ""]}
          loading={loading}
          empty={clans.length === 0}
        >
          {pageItems.map((c) => (
            <Row key={c.id}>
              <Cell>
                <div className="flex items-center gap-2.5">
                  <Avatar2 name={c.name} />
                  <span className="font-medium text-white">{c.name}</span>
                </div>
              </Cell>
              <Cell>{c.region || "—"}</Cell>
              <Cell className="capitalize">{c.focus}</Cell>
              <Cell>
                <div className="flex flex-wrap items-center gap-2">
                  {c.games.length ? (
                    c.games.map((g) => (
                      <span
                        key={g.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                      >
                        <GameIcon game={g} size={14} />
                        <span>{g.name}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
              </Cell>
              <Cell>{c.member_count}</Cell>
              <Cell>{c.owner.username}</Cell>
              <Cell>{c.verified ? <Pill tone="blue">Verified</Pill> : <Pill tone="slate">No</Pill>}</Cell>
              <Cell>{fmtDate(c.created_at)}</Cell>
              <Cell>
                <RowActions onEdit={() => setEditing(c)} onDelete={() => remove(c)} />
              </Cell>
            </Row>
          ))}
        </Table>
        <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
      </Panel>

      {editing && (
        <ClanForm
          clan={editing === "new" ? null : editing}
          games={games}
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

function ClanForm({
  clan,
  games,
  onClose,
  onSaved,
}: {
  clan: Clan | null;
  games: Game[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(clan?.name ?? "");
  const [focus, setFocus] = useState(clan?.focus ?? "");
  const [region, setRegion] = useState(clan?.region ?? "");
  const [logo, setLogo] = useState(clan?.logo ?? "");
  const [description, setDescription] = useState(clan?.description ?? "");
  const [verified, setVerified] = useState(clan?.verified ?? false);
  const [gameIds, setGameIds] = useState<number[]>((clan?.games ?? []).map((g) => g.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleGame(id: number) {
    setGameIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function uploadLogo(file: File) {
    const form = new FormData();
    form.append("logo", file);
    const { data } = await api.post("/clans/upload-logo/", form);
    return data.logo as string;
  }

  async function save() {
    setBusy(true);
    setError("");
    const payload = {
      name,
      focus,
      region,
      logo,
      description,
      verified,
      game_ids: gameIds,
    };
    try {
      if (clan) await api.patch(`/clans/${clan.id}/`, payload);
      else await api.post("/clans/", payload);
      onSaved();
    } catch {
      setError("Couldn't save the clan. Check the fields and try again.");
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={clan ? `Edit ${clan.name}` : "Add clan"}
      onClose={onClose}
      size="2xl"
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
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Clan identity</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{name || "New clan"}</h3>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
              {gameIds.length} linked
            </span>
          </div>

          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_240px] lg:items-start">
            <div className="space-y-4">
              <TextField label="Clan name" value={name} onChange={setName} placeholder="Night Owls" />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Focus" value={focus} onChange={setFocus} options={FOCUS_OPTIONS} />
                <SelectField label="Region" value={region} onChange={setRegion} options={REGION_OPTIONS} />
              </div>
              <TextField label="Description" value={description} onChange={setDescription} textarea />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/85 p-4 lg:sticky lg:top-0">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Preview</p>
              <div className="mt-4 flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                  {logo ? (
                    <img src={logo} alt={name || "Clan"} className="h-full w-full object-contain p-2.5" />
                  ) : (
                    <span className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                      {(name || "CL").slice(0, 2)}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{name || "Clan Name"}</p>
                <p className="text-xs text-slate-400">{region || "Region not selected"}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <Pill tone={verified ? "blue" : "slate"}>{verified ? "Verified" : "Unverified"}</Pill>
                  <Pill tone="slate">{focus || "Focus"}</Pill>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Branding</h3>
              <p className="mt-1 text-xs text-slate-500">Upload a logo that works well in a square crop.</p>
            </div>
          </div>
          <ImageUploadField
            label="Logo"
            value={logo}
            onChange={setLogo}
            onUpload={uploadLogo}
            previewAlt={name || "Clan"}
            showUrlInput={false}
            previewClassName="h-24 w-24 rounded-2xl"
          />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Games</h3>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs text-slate-400">
              {gameIds.length} selected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {games.map((g) => {
              const active = gameIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGame(g.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                    active
                      ? "border-blue-500/50 bg-blue-500/15 text-blue-300 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  <GameIcon game={g} size={14} />
                  {g.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
          <CheckField label="Verified" checked={verified} onChange={setVerified} />
        </section>

        {error && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/25 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </AdminModal>
  );
}
