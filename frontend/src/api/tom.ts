/**
 * Tom's Inner Voice domain API — triggers, auto-comments, chat.
 * @module api/tom
 */

import type { InnerVoiceTrigger, TomResponse } from '../types/investigation';
import { InnerVoiceTriggerSchema, TomResponseSchema } from './schemas';
import { apiCall, apiCallNullable, API_BASE_URL, isApiError, getLLMHeaders } from './base';
import { ApiError } from './base';

export async function checkInnerVoice(
  caseId: string,
  playerId: string,
  evidenceCount: number,
): Promise<InnerVoiceTrigger | null> {
  const path =
    `/api/case/${encodeURIComponent(caseId)}/inner-voice/check` +
    `?player_id=${encodeURIComponent(playerId)}&slot=autosave`;
  return apiCallNullable('POST', path, InnerVoiceTriggerSchema, {
    evidence_count: evidenceCount,
  });
}

/**
 * Check if Tom wants to auto-comment after evidence discovery.
 * Returns null on 204 (Tom stays quiet).
 */
export async function checkTomAutoComment(
  caseId: string,
  playerId: string,
  isCritical = false,
): Promise<TomResponse | null> {
  try {
    const path =
      `/api/case/${encodeURIComponent(caseId)}/tom/auto-comment` +
      `?player_id=${encodeURIComponent(playerId)}&slot=autosave`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getLLMHeaders(),
      },
      body: JSON.stringify({ is_critical: isCritical }),
    });

    // 204 means Tom stays quiet
    if (response.status === 204) {
      return null;
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errData = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new ApiError(response.status, errData.detail ?? response.statusText);
    }

    const data: unknown = await response.json();
    if (data === null) return null;

    const result = TomResponseSchema.safeParse(data);
    if (!result.success) {
      throw new ApiError(0, `Invalid API response: ${result.error.message}`);
    }
    return result.data;
  } catch (error) {
    if (isApiError(error)) throw error;
    if (error instanceof TypeError) {
      throw new ApiError(0, 'Network error: Unable to connect to server.', error.message);
    }
    throw new ApiError(0, 'An unexpected error occurred');
  }
}

export async function sendTomChat(
  caseId: string,
  playerId: string,
  message: string,
): Promise<TomResponse> {
  const path =
    `/api/case/${encodeURIComponent(caseId)}/tom/chat` +
    `?player_id=${encodeURIComponent(playerId)}&slot=autosave`;
  return apiCall('POST', path, TomResponseSchema, { message });
}
