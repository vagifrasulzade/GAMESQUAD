// Helpers for rendering name-based monogram/gradient placeholders.

/** 1–2 letter monogram from a name: "Night Owls" → "NO", "CS2" → "CS". */
export function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2) || "?").toUpperCase();
}

const GRADIENTS = [
  "linear-gradient(140deg, #7c3aed, #4338ca)",
  "linear-gradient(140deg, #ec4899, #8b5cf6)",
  "linear-gradient(140deg, #06b6d4, #3b82f6)",
  "linear-gradient(140deg, #f59e0b, #ef4444)",
  "linear-gradient(140deg, #10b981, #059669)",
  "linear-gradient(140deg, #f43f5e, #b91c1c)",
  "linear-gradient(140deg, #8b5cf6, #6366f1)",
  "linear-gradient(140deg, #14b8a6, #0ea5e9)",
];

/** Deterministic gradient so the same name always gets the same colors. */
export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}
