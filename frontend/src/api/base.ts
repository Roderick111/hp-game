/**
 * API Client — shared infrastructure.
 *
 * Contains base URL, error handling, LLM headers, Zod parsing,
 * and generic helpers (apiCall, apiCallNullable, streamSSE).
 *
 * @module api/base
 */

import { z } from 'zod';
import { formatZodError } from './schemas';

// ============================================
// Configuration
// ============================================

function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;

  if (url && typeof url === 'string' && !url.startsWith('http')) {
    console.warn('VITE_API_URL should include protocol (http:// or https://)');
  }

  return url ?? 'http://localhost:8000';
}

export const API_BASE_URL = getApiBaseUrl();

// ============================================
// BYOK (Bring Your Own Key) Headers
// ============================================

const LLM_SETTINGS_KEY = 'hp_llm_settings';

export interface LLMSettings {
  provider: string | null;
  apiKey: string | null;
  model: string | null;
}

export function getLLMSettings(): LLMSettings | null {
  const raw = localStorage.getItem(LLM_SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LLMSettings;
  } catch {
    return null;
  }
}

export function saveLLMSettings(settings: LLMSettings): void {
  localStorage.setItem(LLM_SETTINGS_KEY, JSON.stringify(settings));
}

export function clearLLMSettings(): void {
  localStorage.removeItem(LLM_SETTINGS_KEY);
}

export function getLLMHeaders(): Record<string, string> {
  const settings = getLLMSettings();
  if (!settings) return {};
  const headers: Record<string, string> = {};
  if (settings.apiKey) headers['X-User-API-Key'] = settings.apiKey;
  if (settings.model) headers['X-User-Model'] = settings.model;
  return headers;
}

// ============================================
// Error Handling
// ============================================

interface ErrorResponseBody {
  detail?: string;
  message?: string;
}

/**
 * Custom Error class for API errors.
 * Extends Error to satisfy eslint @typescript-eslint/only-throw-error.
 */
export class ApiError extends Error {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as ApiError).status === 'number'
  );
}

async function createApiError(response: Response): Promise<ApiError> {
  let message = `API error: ${response.status} ${response.statusText}`;
  let details: string | undefined;

  try {
    const errorBody = (await response.json()) as ErrorResponseBody;
    if (errorBody.detail) {
      message = errorBody.detail;
    } else if (errorBody.message) {
      message = errorBody.message;
    }
    details = JSON.stringify(errorBody);
  } catch {
    // Response body is not JSON, use default message
  }

  return new ApiError(response.status, message, details);
}

function handleFetchError(error: unknown): ApiError {
  if (error instanceof TypeError) {
    return new ApiError(
      0,
      'Network error: Unable to connect to server. Is the backend running?',
      error.message,
    );
  }

  if (error instanceof Error) {
    return new ApiError(0, error.message, error.stack);
  }

  return new ApiError(0, 'An unexpected error occurred');
}

function handleZodError(error: z.ZodError): ApiError {
  const message = `Invalid API response: ${formatZodError(error)}`;
  return new ApiError(0, message, JSON.stringify(error.issues));
}

// ============================================
// Generic Helpers
// ============================================

export function parseResponse<T>(data: unknown, schema: z.ZodType<T>): T {
  if (data === null) {
    throw new ApiError(
      0,
      'Invalid API response: Received null instead of expected data',
      'Backend returned null with 200 status. Should return 404 for missing data.',
    );
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    throw handleZodError(result.error);
  }

  return result.data;
}

/**
 * Generic API call with fetch + LLM headers + error handling + Zod parse.
 */
export async function apiCall<T>(
  method: string,
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getLLMHeaders(),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    const data: unknown = await response.json();
    return parseResponse(data, schema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Generic API call that returns null on 404 instead of throwing.
 * Also handles null response bodies gracefully.
 */
export async function apiCallNullable<T>(
  method: string,
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getLLMHeaders(),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw await createApiError(response);
    }

    const data: unknown = await response.json();
    if (data === null) {
      return null;
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      throw handleZodError(result.error);
    }
    return result.data;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Streaming SSE
// ============================================

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (data: Record<string, unknown>) => void;
  onError: (error: string) => void;
}

export async function streamSSE(
  url: string,
  body: unknown,
  callbacks: StreamCallbacks,
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getLLMHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    callbacks.onError(`HTTP ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
        if (data.error) {
          callbacks.onError(data.error as string);
          return;
        }
        if (data.done) {
          callbacks.onDone(data);
          return;
        }
        if (data.text) {
          callbacks.onChunk(data.text as string);
        }
      } catch {
        // Skip malformed SSE lines
      }
    }
  }
}
