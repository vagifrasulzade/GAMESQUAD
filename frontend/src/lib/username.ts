const ADJECTIVES = [
  "Silent",
  "Swift",
  "Crimson",
  "Iron",
  "Shadow",
  "Neon",
  "Ghost",
  "Solar",
  "Lunar",
  "Frost",
];

const NOUNS = [
  "Raven",
  "Saber",
  "Falcon",
  "Vortex",
  "Blade",
  "Warden",
  "Runner",
  "Spectre",
  "Guardian",
  "Strider",
];

export function generateUsername(opts?: { withNumber?: boolean; separator?: string }) {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const separator = opts?.separator ?? "";
  let base = `${adjective}${separator}${noun}`;
  if (opts?.withNumber) {
    const n = Math.floor(Math.random() * 9000) + 100; // 100-9099
    base = `${base}${separator}${n}`;
  }
  // Make a safe username: remove spaces, lower-case first letter optional
  return base.replace(/\s+/g, "");
}

export default generateUsername;
