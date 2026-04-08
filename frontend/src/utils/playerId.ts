/**
 * Anonymous Player ID Management
 *
 * Generates and persists a UUID per browser via localStorage.
 * Replaces hardcoded "default" player_id.
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
