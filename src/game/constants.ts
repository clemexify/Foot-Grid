import type { Mode } from "./types";

export const MAX_ERRORS = 4;

export const MODE_INFO: Record<Mode, { label: string; cls: string; emoji: string }> = {
  cc: { label: "CLUB x CLUB", cls: "cc", emoji: "🏟️" },
  ca: { label: "CLUB x ANNEE", cls: "ca", emoji: "📅" },
  cs: { label: "CLUB x SELE.", cls: "cs", emoji: "⚽" }
};

export const FLAGS: Record<string, string> = {
  France: "🇫🇷",
  Sénégal: "🇸🇳",
  "Côte d'Ivoire": "🇨🇮",
  Algérie: "🇩🇿",
  Maroc: "🇲🇦",
  Mali: "🇲🇱",
  Cameroun: "🇨🇲",
  Brésil: "🇧🇷",
  Portugal: "🇵🇹",
  Belgique: "🇧🇪",
  "RD Congo": "🇨🇩",
  Angleterre: "🏴",
  Espagne: "🇪🇸",
  Allemagne: "🇩🇪",
  Italie: "🇮🇹",
  Nigeria: "🇳🇬",
  Ghana: "🇬🇭",
  Guinée: "🇬🇳",
  "Pays-Bas": "🇳🇱",
  Argentine: "🇦🇷",
  Pologne: "🇵🇱",
  Suisse: "🇨🇭",
  Danemark: "🇩🇰",
  Norvège: "🇳🇴",
  Togo: "🇹🇬",
  Haïti: "🇭🇹",
  "États-Unis": "🇺🇸",
  Suède: "🇸🇪",
  Géorgie: "🇬🇪",
  Jamaïque: "🇯🇲",
  Comores: "🇰🇲",
  Gabon: "🇬🇦",
  "Burkina Faso": "🇧🇫",
  "Guinée-Bissau": "🇬🇼",
  Mauritanie: "🇲🇷",
  Tunisie: "🇹🇳",
  Ukraine: "🇺🇦",
  Égypte: "🇪🇬",
  Croatie: "🇭🇷",
  Colombie: "🇨🇴",
  Turquie: "🇹🇷",
  "Corée du Sud": "🇰🇷"
};

export const CLUB_LOGOS: Record<string, string> = {
  PSG: "🔵",
  Lyon: "🔴",
  Marseille: "🔵",
  Monaco: "🔴",
  LOSC: "🔴",
  Rennes: "🔴",
  Nice: "🔴",
  "RC Lens": "🟡",
  Strasbourg: "🔵",
  Toulouse: "🟣",
  Nantes: "🟡",
  Brest: "🔴",
  Auxerre: "🔵",
  "Le Havre": "🔵",
  Metz: "🟣",
  Lorient: "🟠",
  Angers: "⚫",
  "Paris FC": "🔵"
};
