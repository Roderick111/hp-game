/**
 * Briefing domain API — case briefings, teaching questions.
 * @module api/briefing
 */

import type {
  BriefingContent,
  BriefingQuestionResponse,
  BriefingCompleteResponse,
} from '../types/investigation';
import {
  BriefingContentSchema,
  BriefingQuestionResponseSchema,
  BriefingCompleteResponseSchema,
} from './schemas';
import { apiCall } from './base';

export async function getBriefing(
  caseId: string,
  playerId = 'default',
): Promise<BriefingContent> {
  const path =
    `/api/briefing/${encodeURIComponent(caseId)}` +
    `?player_id=${encodeURIComponent(playerId)}&slot=autosave`;
  return apiCall('GET', path, BriefingContentSchema);
}

export async function askBriefingQuestion(
  caseId: string,
  question: string,
  playerId = 'default',
): Promise<BriefingQuestionResponse> {
  const path = `/api/briefing/${encodeURIComponent(caseId)}/question`;
  return apiCall('POST', path, BriefingQuestionResponseSchema, {
    question,
    player_id: playerId,
    slot: 'autosave',
  });
}

export async function markBriefingComplete(
  caseId: string,
  playerId = 'default',
): Promise<BriefingCompleteResponse> {
  const path =
    `/api/briefing/${encodeURIComponent(caseId)}/complete` +
    `?player_id=${encodeURIComponent(playerId)}&slot=autosave`;
  return apiCall('POST', path, BriefingCompleteResponseSchema);
}
