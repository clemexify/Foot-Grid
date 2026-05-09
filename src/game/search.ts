import type { Player } from "./types";

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchPlayers(players: Player[], query: string, limit = 8) {
  if (query.length < 2) {
    return [];
  }

  const normalizedQuery = normalizeSearchText(query);
  const seen = new Set<string>();

  return players
    .filter((player) => {
      if (seen.has(player.nom)) {
        return false;
      }
      seen.add(player.nom);
      return normalizeSearchText(player.nom).includes(normalizedQuery);
    })
    .sort((a, b) => {
      const aStarts = normalizeSearchText(a.nom)
        .split(" ")
        .some((word) => word.startsWith(normalizedQuery));
      const bStarts = normalizeSearchText(b.nom)
        .split(" ")
        .some((word) => word.startsWith(normalizedQuery));
      return Number(bStarts) - Number(aStarts);
    })
    .slice(0, limit);
}
