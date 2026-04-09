/**
 * LLM configuration domain API — BYOK key verification, models.
 * @module api/settings
 */

import { API_BASE_URL } from './base';

export interface VerifyKeyResponse {
  valid: boolean;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  free: boolean;
}

export async function verifyApiKey(
  provider: string,
  apiKey: string,
  model?: string,
): Promise<VerifyKeyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/llm/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey, model }),
    });
    return (await response.json()) as VerifyKeyResponse;
  } catch {
    return { valid: false, error: 'Network error' };
  }
}

export async function getAvailableModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/llm/models`);
    return (await response.json()) as ModelInfo[];
  } catch {
    return [];
  }
}

export async function getActiveModel(): Promise<{
  model_id: string;
  model_name: string;
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/llm/active`);
    return (await response.json()) as { model_id: string; model_name: string };
  } catch {
    return null;
  }
}
