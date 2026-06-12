import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { gradientFor, initials } from "../lib/avatar";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-line bg-card ${className}`}>{children}</div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "brand" | "good" | "warn";
}) {
  const tones: Record<string, string> = {
    default: "bg-card2 text-muted border-line",
    brand: "bg-brand/15 text-brand-2 border-brand/30",
    good: "bg-good/15 text-good border-good/30",
    warn: "bg-warn/15 text-warn border-warn/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  to,
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline" | "good";
  /** When set, the button renders as a router link (avoids invalid <button> inside <a>). */
  to?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string, string> = {
    primary: "bg-brand hover:bg-brand/90 text-white",
    good: "bg-good hover:bg-good/90 text-white",
    ghost: "bg-card2 hover:bg-line text-white",
    outline: "border border-line hover:bg-card2 text-white",
  };
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function Avatar({
  src,
  alt,
  size = 40,
  online,
}: {
  src?: string;
  alt: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full rounded-full object-cover ring-1 ring-line"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full font-semibold uppercase text-white ring-1 ring-white/10"
          style={{ fontSize: Math.max(11, Math.round(size * 0.36)), background: gradientFor(alt) }}
        >
          {initials(alt)}
        </div>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-good" />
      )}
    </div>
  );
}

export function Verified() {
  return <BadgeCheck className="h-4 w-4 text-brand-2" />;
}

/** Renders a game's logo, falling back to a colored chip when no icon is set. */
export function GameIcon({
  game,
  size = 20,
}: {
  game: { name: string; icon?: string; color?: string; slug?: string };
  size?: number;
}) {
  const color = game.color ?? "#7c3aed";
  const content = game.icon ? (
    <img
      src={game.icon}
      alt={game.name}
      title={game.name}
      className="shrink-0 rounded-md object-contain"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      title={game.name}
      className="inline-flex shrink-0 items-center justify-center rounded-md font-bold uppercase leading-none text-white ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.4)),
        background: `linear-gradient(140deg, ${color}, ${color}66)`,
      }}
    >
      {initials(game.name)}
    </span>
  );

  // If the game has a slug, make the icon clickable to the game's page.
  if (game.slug) {
    return (
      <Link to={`/games/${game.slug}`} className="inline-block" title={game.name}>
        {content}
      </Link>
    );
  }

  return content;
}

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  // Render through a portal to <body> so the fixed overlay is positioned
  // against the viewport. Page wrappers use `animate-fade-in`, whose persistent
  // `transform` would otherwise trap this fixed element inside the content
  // column (hiding it behind the layout) and break the modal.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-lg p-1 text-muted transition hover:bg-card2 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ProgressBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-good" : value >= 70 ? "bg-brand" : "bg-warn";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-card2">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-brand" />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
