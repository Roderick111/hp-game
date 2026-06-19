/**
 * Anonymous Player ID Management
 *
 * Generates and persists a UUID per browser via localStorage.
 * Session bootstrap (POST /api/session) may later upgrade this
 * to a server-issued ID, but the key stays the same.
 *
 * @module utils/playerId
 */

const KEY = "hp_player_id";

export function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
