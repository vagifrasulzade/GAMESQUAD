import { useEffect, useState } from "react";
import { api, fetchAll } from "../../lib/api";
import type { Game, Recruitment, Team } from "../../lib/types";
import {
  AdminButton,
  AdminHeader,
  AdminModal,
  Avatar2,
  CheckField,
  Cell,
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
  statusTone,
  usePagination,
} from "./adminUi";
import { GameIcon } from "../../components/ui";

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [recs, setRecs] = useState<Recruitment[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Team | "new" | null>(null);
  const [editingRec, setEditingRec] = useState<Recruitment | "new" | null>(null);
  const [regionFilter, setRegionFilter] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetchAll<Team>("/teams/"),
      fetchAll<Recruitment>("/recruitments/"),
      fetchAll<Game>("/games/"),
    ])
      .then(([t, r, g]) => {
        setTeams(t);
        setRecs(r);
        setGames(g);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filteredTeams = regionFilter
    ? teams.filter((t) => t.region === regionFilter)
    : teams;

  const filteredRecs = regionFilter
    ? recs.filter((r) => (r.team?.region ?? "") === regionFilter)
    : recs;

  const teamsPage = usePagination(filteredTeams);
  const recsPage = usePagination(filteredRecs);

  async function removeTeam(t: Team) {
    if (!confirm(`Delete team “${t.name}”? This cannot be undone.`)) return;
    await api.delete(`/teams/${t.id}/`);
    load();
  }

  async function removeRec(r: Recruitment) {
    if (!confirm(`Delete recruitment “${r.title}”?`)) return;
    await api.delete(`/recruitments/${r.id}/`);
    load();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHeader
        title="Teams & Recruitment"
        subtitle={`${teams.length} teams · ${recs.length} recruitments`}
        action={<NewButton label="Add team" onClick={() => setEditing("new")} />}
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="w-56">
          <SelectField
            label="Region"
            value={regionFilter}
            onChange={setRegionFilter}
            options={REGION_OPTIONS}
          />
        </div>
        {regionFilter && (
          <button
            type="button"
            onClick={() => setRegionFilter("")}
            className="mt-5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            Clear filter
          </button>
        )}
      </div>

      <Panel>
        <div className="border-b border-slate-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Teams</h2>
        </div>
        <Table
          columns={["Team", "Game", "Playstyle", "Members", "Owner", "Verified", ""]}
          loading={loading}
          empty={filteredTeams.length === 0}
        >
          {teamsPage.pageItems.map((t) => (
            <Row key={t.id}>
              <Cell>
                <div className="flex items-center gap-2.5">
                  <Avatar2 name={t.name} />
                  <span className="font-medium text-white">{t.name}</span>
                </div>
              </Cell>
              <Cell>
                <div className="inline-flex items-center gap-2">
                  <GameIcon game={t.game} size={14} />
                  <span>{t.game.name}</span>
                </div>
              </Cell>
              <Cell className="capitalize">{t.playstyle}</Cell>
              <Cell>{t.member_count}</Cell>
              <Cell>{t.owner.username}</Cell>
              <Cell>{t.verified ? <Pill tone="blue">Verified</Pill> : <Pill tone="slate">No</Pill>}</Cell>
              <Cell>
                <RowActions onEdit={() => setEditing(t)} onDelete={() => removeTeam(t)} />
              </Cell>
            </Row>
          ))}
        </Table>
        <Pagination
          page={teamsPage.page}
          pageCount={teamsPage.pageCount}
          total={teamsPage.total}
          onPage={teamsPage.setPage}
        />
      </Panel>

      <Panel>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Recruitments</h2>
          <NewButton label="Add recruitment" onClick={() => setEditingRec("new")} />
        </div>
        <Table
          columns={["Title", "Game", "Region", "By", "Type", "Apps", "Status", "Created", ""]}
          loading={loading}
          empty={filteredRecs.length === 0}
        >
          {recsPage.pageItems.map((r) => (
            <Row key={r.id}>
              <Cell className="text-white">{r.title}</Cell>
              <Cell>
                <div className="inline-flex items-center gap-2">
                  <GameIcon game={r.game} size={14} />
                  <span>{r.game.name}</span>
                </div>
              </Cell>
              <Cell>{r.team?.region || "—"}</Cell>
              <Cell>{r.created_by.username}</Cell>
              <Cell className="capitalize">{r.type}</Cell>
              <Cell>{r.application_count}</Cell>
              <Cell>
                <Pill tone={statusTone(r.status)}>{r.status}</Pill>
              </Cell>
              <Cell>{fmtDate(r.created_at)}</Cell>
              <Cell>
                <RowActions onEdit={() => setEditingRec(r)} onDelete={() => removeRec(r)} />
              </Cell>
            </Row>
          ))}
        </Table>
        <Pagination
          page={recsPage.page}
          pageCount={recsPage.pageCount}
          total={recsPage.total}
          onPage={recsPage.setPage}
        />
      </Panel>

      {editing && (
        <TeamForm
          team={editing === "new" ? null : editing}
          games={games}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {editingRec && (
        <RecruitmentForm
          recruitment={editingRec === "new" ? null : editingRec}
          teams={teams}
          games={games}
          onClose={() => setEditingRec(null)}
          onSaved={() => {
            setEditingRec(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function TeamForm({
  team,
  games,
  onClose,
  onSaved,
}: {
  team: Team | null;
  games: Game[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team?.name ?? "");
  const [gameId, setGameId] = useState(String(team?.game.id ?? games[0]?.id ?? ""));
  const [playstyle, setPlaystyle] = useState(team?.playstyle ?? "competitive");
  const [region, setRegion] = useState(team?.region ?? "");
  const [logo, setLogo] = useState(team?.logo ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [verified, setVerified] = useState(team?.verified ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadLogo(file: File) {
    const form = new FormData();
    form.append("logo", file);
    const { data } = await api.post("/teams/upload-logo/", form);
    return data.logo as string;
  }

  async function save() {
    setBusy(true);
    setError("");
    const payload = {
      name,
      game_id: Number(gameId),
      playstyle,
      region,
      logo,
      description,
      verified,
    };
    try {
      if (team) await api.patch(`/teams/${team.id}/`, payload);
      else await api.post("/teams/", payload);
      onSaved();
    } catch {
      setError("Couldn't save the team. Check the fields and try again.");
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={team ? `Edit ${team.name}` : "Add team"}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={busy || !name.trim() || !gameId}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Basic Info</h3>
          <div className="space-y-4">
            <TextField label="Team name" value={name} onChange={setName} placeholder="Phoenix Rising" />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Game"
                value={gameId}
                onChange={setGameId}
                  options={games.map((g) => ({ value: String(g.id), label: g.name }))}
                />
                <SelectField
                  label="Playstyle"
                  value={playstyle}
                  onChange={setPlaystyle}
                  options={[
                    { value: "competitive", label: "Competitive" },
                    { value: "casual", label: "Casual" },
                  ]}
                />
              </div>
            <SelectField label="Region" value={region} onChange={setRegion} options={REGION_OPTIONS} />
          </div>
        </section>

          <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Game</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {games.map((g) => {
                const active = String(g.id) === gameId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGameId(String(g.id))}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                      active
                        ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
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

        <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Branding</h3>
          <ImageUploadField
            label="Logo"
            value={logo}
            onChange={setLogo}
            onUpload={uploadLogo}
            previewAlt={name || "Team"}
            showUrlInput={false}
            previewClassName="h-24 w-24 rounded-xl"
          />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">About</h3>
          <TextField label="Description" value={description} onChange={setDescription} textarea />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <CheckField label="Verified" checked={verified} onChange={setVerified} />
        </section>

        {error && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/25 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </AdminModal>
  );
}

function RecruitmentForm({
  recruitment,
  teams,
  games,
  onClose,
  onSaved,
}: {
  recruitment: Recruitment | null;
  teams: Team[];
  games: Game[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(recruitment?.title ?? "");
  const [description, setDescription] = useState(recruitment?.description ?? "");
  const [gameId, setGameId] = useState(String(recruitment?.game.id ?? games[0]?.id ?? ""));
  const [teamId, setTeamId] = useState(String(recruitment?.team?.id ?? ""));
  const [rolesNeeded, setRolesNeeded] = useState((recruitment?.roles_needed ?? []).join(", "));
  const [slots, setSlots] = useState(String(recruitment?.slots ?? 1));
  const [rankRequirement, setRankRequirement] = useState(recruitment?.rank_requirement ?? "");
  const [schedule, setSchedule] = useState(recruitment?.schedule ?? "");
  const [type, setType] = useState(recruitment?.type ?? "competitive");
  const [status, setStatus] = useState(recruitment?.status ?? "open");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filteredTeams = teamId || !gameId ? teams : teams.filter((team) => String(team.game.id) === gameId);

  async function save() {
    setBusy(true);
    setError("");
    const payload = {
      title,
      description,
      game_id: Number(gameId),
      team_id: teamId ? Number(teamId) : null,
      roles_needed: rolesNeeded
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
      slots: Number(slots) || 1,
      rank_requirement: rankRequirement,
      schedule,
      type,
      status,
    };
    try {
      if (recruitment) await api.patch(`/recruitments/${recruitment.id}/`, payload);
      else await api.post("/recruitments/", payload);
      onSaved();
    } catch {
      setError("Couldn't save the recruitment. Check the fields and try again.");
      setBusy(false);
    }
  }

  return (
    <AdminModal
      title={recruitment ? `Edit ${recruitment.title}` : "Add recruitment"}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={busy || !title.trim() || !gameId}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Basic Info</h3>
          <div className="space-y-4">
            <TextField label="Title" value={title} onChange={setTitle} placeholder="Looking for a support player" />
            <TextField label="Description" value={description} onChange={setDescription} textarea />
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Game</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {games.map((g) => {
              const active = String(g.id) === gameId;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGameId(String(g.id))}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                    active
                      ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
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

        <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Team</h3>
          <SelectField
            label="Linked team"
            value={teamId}
            onChange={setTeamId}
            options={[
              { value: "", label: "No team" },
              ...filteredTeams.map((team) => ({ value: String(team.id), label: `${team.name} · ${team.game.name}` })),
            ]}
          />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Details</h3>
          <div className="space-y-4">
            <TextField label="Roles needed" value={rolesNeeded} onChange={setRolesNeeded} placeholder="IGL, support" />
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Slots" value={slots} onChange={setSlots} />
              <TextField label="Rank requirement" value={rankRequirement} onChange={setRankRequirement} />
            </div>
            <TextField label="Schedule" value={schedule} onChange={setSchedule} placeholder="Weeknights 8pm" />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Type"
                value={type}
                onChange={setType}
                options={[
                  { value: "competitive", label: "Competitive" },
                  { value: "casual", label: "Casual" },
                ]}
              />
              <SelectField
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                ]}
              />
            </div>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-900/50 bg-red-950/25 px-4 py-3 text-sm text-red-300">{error}</div>}
      </div>
    </AdminModal>
  );
}
