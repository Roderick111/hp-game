/**
 * Save/Load domain API — state persistence, slots, import/export.
 * @module api/saves
 */

import type {
  SaveStateRequest,
  SaveResponse,
  LoadResponse,
  InvestigationState,
  SaveSlotMetadata,
  SaveSlotResponse,
  DeleteSlotResponse,
} from '../types/investigation';
import {
  SaveResponseSchema,
  LoadResponseSchema,
  SaveSlotResponseSchema,
  SaveSlotsListResponseSchema,
  DeleteSlotResponseSchema,
} from './schemas';
import { apiCall, apiCallNullable } from './base';

export async function saveState(
  playerId: string,
  state: InvestigationState,
  slot = 'autosave',
): Promise<SaveResponse> {
  const request: SaveStateRequest = {
    player_id: playerId,
    state,
  };
  const path = `/api/save?slot=${encodeURIComponent(slot)}`;
  return apiCall('POST', path, SaveResponseSchema, request);
}

export async function loadState(
  caseId: string,
  playerId = 'default',
  slot = 'autosave',
  locationId?: string,
): Promise<LoadResponse | null> {
  let path =
    `/api/load/${encodeURIComponent(caseId)}` +
    `?player_id=${encodeURIComponent(playerId)}` +
    `&slot=${encodeURIComponent(slot)}`;
  if (locationId) {
    path += `&location_id=${encodeURIComponent(locationId)}`;
  }
  return apiCallNullable('GET', path, LoadResponseSchema);
}

export async function saveGameState(
  _caseId: string,
  state: InvestigationState,
  slot = 'autosave',
  playerId = 'default',
): Promise<SaveSlotResponse> {
  return apiCall('POST', '/api/save', SaveSlotResponseSchema, {
    player_id: playerId,
    state: state,
    slot: slot,
  });
}

export async function loadGameState(
  caseId: string,
  slot = 'autosave',
  playerId = 'default',
): Promise<LoadResponse | null> {
  const path =
    `/api/load/${encodeURIComponent(caseId)}` +
    `?player_id=${encodeURIComponent(playerId)}` +
    `&slot=${encodeURIComponent(slot)}`;
  return apiCallNullable('GET', path, LoadResponseSchema);
}

export async function listSaveSlots(
  caseId: string,
  playerId = 'default',
): Promise<SaveSlotMetadata[]> {
  const path =
    `/api/case/${encodeURIComponent(caseId)}/saves/list` +
    `?player_id=${encodeURIComponent(playerId)}`;
  const data = await apiCall('GET', path, SaveSlotsListResponseSchema);
  return data.saves;
}

export async function deleteSaveSlot(
  caseId: string,
  slot: string,
  playerId = 'default',
): Promise<DeleteSlotResponse> {
  const path =
    `/api/case/${encodeURIComponent(caseId)}` +
    `/saves/${encodeURIComponent(slot)}` +
    `?player_id=${encodeURIComponent(playerId)}`;
  // DELETE with no body — use apiCall but override: no LLM headers needed
  return apiCall('DELETE', path, DeleteSlotResponseSchema);
}
