import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";

export function AdminHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}

/** A styled table. Pass column headers and rows of cells. */
export function Table({
  columns,
  children,
  empty,
  loading,
}: {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-5 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500">
                Loading…
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500">
                No records found.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-slate-800/40">{children}</tr>;
}

export const ADMIN_PAGE_SIZE = 20;

/**
 * Client-side pagination over an already-loaded (and optionally filtered) list.
 * Returns the current page slice plus the controls the <Pagination> bar needs.
 * The page index is clamped so it stays valid as the list shrinks (e.g. search).
 */
export function usePagination<T>(items: T[], pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { page: safePage, setPage, pageCount, pageItems, total: items.length, pageSize };
}

function pageNumbers(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(pageCount - 1, page + 1);
  if (left > 2) out.push("…");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < pageCount - 1) out.push("…");
  out.push(pageCount);
  return out;
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  label,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-blue-600 font-medium text-white"
          : "border border-slate-700 text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

/** Pagination bar. Render it directly under a <Table> inside a <Panel>. */
export function Pagination({
  page,
  pageCount,
  total,
  onPage,
  pageSize = ADMIN_PAGE_SIZE,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
  pageSize?: number;
}) {
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-3 text-sm">
      <span className="text-slate-500">
        Showing <span className="text-slate-300">{from}–{to}</span> of{" "}
        <span className="text-slate-300">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <PageButton disabled={page <= 1} onClick={() => onPage(page - 1)} label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </PageButton>
        {pageNumbers(page, pageCount).map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-1.5 text-slate-600">
              …
            </span>
          ) : (
            <PageButton key={n} active={n === page} onClick={() => onPage(n)}>
              {n}
            </PageButton>
          )
        )}
        <PageButton disabled={page >= pageCount} onClick={() => onPage(page + 1)} label="Next page">
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </div>
    </div>
  );
}

export function Cell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-5 py-3 text-slate-300 ${className}`}>{children}</td>;
}

const PILL_TONES: Record<string, string> = {
  green: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  amber: "bg-amber-500/15 text-amber-400",
  red: "bg-red-500/15 text-red-400",
  slate: "bg-slate-700/40 text-slate-400",
};

export function Pill({ tone = "slate", children }: { tone?: keyof typeof PILL_TONES; children: ReactNode }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof PILL_TONES {
  switch (status) {
    case "accepted":
    case "resolved":
    case "active":
    case "open":
      return status === "open" ? "amber" : "green";
    case "pending":
    case "in_progress":
      return "blue";
    case "rejected":
    case "closed":
      return "red";
    default:
      return "slate";
  }
}

export function Avatar2({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xs font-semibold text-blue-300">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function fmtDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// CRUD building blocks
// ---------------------------------------------------------------------------

export function AdminButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string, string> = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    ghost: "border border-slate-700 text-slate-300 hover:bg-slate-800",
    danger: "bg-red-600/90 hover:bg-red-600 text-white",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function NewButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <AdminButton onClick={onClick}>
      <Plus className="h-4 w-4" /> {label}
    </AdminButton>
  );
}

/** Edit + delete icon buttons for the trailing cell of a table row. */
export function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <button
          onClick={onEdit}
          aria-label="Edit"
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-blue-400"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={onDelete}
        aria-label="Delete"
        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

const MODAL_WIDTHS = {
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
} as const;

export function AdminModal({
  title,
  onClose,
  children,
  footer,
  size = "lg",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof MODAL_WIDTHS;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`animate-fade-in relative z-10 max-h-[90vh] w-full ${MODAL_WIDTHS[size]} overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500";

export const FOCUS_OPTIONS = [
  { value: "", label: "Select focus" },
  { value: "competitive", label: "Competitive" },
  { value: "casual", label: "Casual" },
  { value: "mixed", label: "Mixed" },
];

export const REGION_OPTIONS = [
  { value: "", label: "Select region" },
  { value: "NA", label: "North America" },
  { value: "EU", label: "Europe" },
  { value: "MEA", label: "Middle East & Africa" },
  { value: "LATAM", label: "Latin America" },
  { value: "APAC", label: "Asia Pacific" },
  { value: "SEA", label: "Southeast Asia" },
  { value: "OCE", label: "Oceania" },
  { value: "CIS", label: "CIS" },
  { value: "OTHER", label: "Other" },
];

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className={fieldClass}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldClass}
        />
      )}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ImageUploadField({
  label,
  value,
  onChange,
  onUpload,
  previewAlt,
  inputLabel,
  placeholder = "Paste image URL or upload a file",
  previewClassName = "h-20 w-20 rounded-lg",
  showUrlInput = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (file: File) => Promise<string>;
  previewAlt: string;
  inputLabel?: string;
  placeholder?: string;
  previewClassName?: string;
  showUrlInput?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch {
      setError("Upload failed. Try a PNG, JPG, WebP, or SVG file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex items-center gap-4">
        <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-700 bg-slate-950 ${previewClassName}`}>
          {value ? (
            <img src={value} alt={previewAlt} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {previewAlt.slice(0, 2)}
            </span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-600/50 bg-blue-600/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-600/20">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
              disabled={uploading}
            />
            {uploading ? "Uploading…" : `Upload ${label}`}
          </label>
          {showUrlInput && (
            <TextField
              label={inputLabel ?? `${label} URL`}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
            />
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}
