export interface Game {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  roles: string[];
  ranks: string[];
  is_active: boolean;
}

export interface GameAccount {
  id: number;
  game: Game;
  in_game_name: string;
  rank: string;
  role: string;
}

export interface User {
  id: number;
  username: string;
  tag: string;
  display_tag: string;
  full_name: string;
  email: string;
  avatar: string;
  bio: string;
  country: string;
  region: string;
  languages: string[];
  is_online: boolean;
  status: string;
  verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  playstyle: string;
  looking_for: string;
  main_roles: string[];
  availability_days: string[];
  availability_from: string;
  availability_to: string;
  wins: number;
  kd: string;
  matches: number;
  game_accounts: GameAccount[];
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  logo: string;
  description: string;
  region: string;
  playstyle: string;
  verified: boolean;
  game: Game;
  owner: User;
  member_count: number;
  is_member?: boolean;
  created_at: string;
}

export interface Clan {
  id: number;
  name: string;
  slug: string;
  logo: string;
  description: string;
  region: string;
  focus: string;
  verified: boolean;
  games: Game[];
  owner: User;
  member_count: number;
  is_member?: boolean;
  created_at: string;
}

export interface Recruitment {
  id: number;
  title: string;
  description: string;
  game: Game;
  team: Team | null;
  created_by: User;
  roles_needed: string[];
  slots: number;
  rank_requirement: string;
  schedule: string;
  type: string;
  status: string;
  application_count: number;
  has_applied?: boolean;
  created_at: string;
}

export interface MatchCard {
  id: number;
  kind: "team" | "clan";
  name: string;
  logo: string;
  description: string;
  verified: boolean;
  region: string;
  member_count: number;
  playstyle: string | null;
  game: string | null;
  games: { id: number; name: string; icon: string; color: string }[];
  compatibility: number;
  breakdown: Record<string, number>;
  reasons: string[];
}

export interface GameEvent {
  id: number;
  title: string;
  slug: string;
  description: string;
  banner: string;
  game: Game | null;
  mode: "tournament" | "scrim" | "community";
  format: string;
  region: string;
  prize: string;
  starts_at: string;
  max_teams: number;
  host: User;
  participant_count: number;
  is_registered: boolean;
  created_at: string;
}

export interface SavedItem {
  id: number;
  target_type: "team" | "clan" | "recruitment" | "player";
  target_id: number;
  target: {
    name: string;
    logo: string;
    subtitle: string;
    games: Game[];
  } | null;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
