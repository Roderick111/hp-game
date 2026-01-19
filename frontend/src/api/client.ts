/**
 * API Client for Phase 1 Investigation Backend
 *
 * Type-safe fetch wrappers for communicating with the FastAPI backend.
 * Handles error cases (network failures, 404, 500) with proper error types.
 * Uses Zod for runtime validation of API responses (Phase 5.8).
 *
 * @module api/client
 * @since Phase 1
 */

import { z } from 'zod';
import type {
  InvestigateRequest,
  InvestigateResponse,
  SaveStateRequest,
  SaveResponse,
  LoadResponse,
  EvidenceResponse,
  EvidenceDetails,
  LocationResponse,
  InvestigationState,
  ApiError as ApiErrorType,
  InterrogateRequest,
  InterrogateResponse,
  PresentEvidenceRequest,
  PresentEvidenceResponse,
  WitnessInfo,
  SubmitVerdictRequest,
  SubmitVerdictResponse,
  BriefingContent,
  BriefingQuestionResponse,
  BriefingCompleteResponse,
  InnerVoiceTrigger,
  TomResponse,
  LocationInfo,
  ChangeLocationResponse,
  SaveSlotMetadata,
  SaveSlotResponse,
  DeleteSlotResponse,
  CaseListResponse,
} from '../types/investigation';
import {
  formatZodError,
  InvestigateResponseSchema,
  SaveResponseSchema,
  LoadResponseSchema,
  EvidenceResponseSchema,
  EvidenceDetailsSchema,
  LocationResponseSchema,
  WitnessInfoSchema,
  InterrogateResponseSchema,
  PresentEvidenceResponseSchema,
  SubmitVerdictResponseSchema,
  BriefingContentSchema,
  BriefingQuestionResponseSchema,
  BriefingCompleteResponseSchema,
  InnerVoiceTriggerSchema,
  TomResponseSchema,
  LocationInfoSchema,
  ChangeLocationResponseSchema,
  SaveSlotsListResponseSchema,
  SaveSlotResponseSchema,
  DeleteSlotResponseSchema,
  CaseListResponseSchema,
  ResetResponseSchema,
  InvestigationStateSchema,
} from './schemas';

/**
 * Custom Error class for API errors
 * Extends Error to satisfy eslint @typescript-eslint/only-throw-error
 */
class ApiError extends Error implements ApiErrorType {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// ============================================
// Configuration
// ============================================

/**
 * Get API base URL from environment variable with fallback to localhost
 * Set VITE_API_URL in .env file for different environments
 */
function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;

  if (url && typeof url === 'string' && !url.startsWith('http')) {
    console.warn('VITE_API_URL should include protocol (http:// or https://)');
  }

  return url ?? 'http://localhost:8000';
}

const API_BASE_URL = getApiBaseUrl();

// ============================================
// Error Handling
// ============================================

interface ErrorResponseBody {
  detail?: string;
  message?: string;
}

/**
 * Create an ApiError from a Response object
 */
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

/**
 * Handle fetch errors (network failures, timeouts)
 */
function handleFetchError(error: unknown): ApiError {
  if (error instanceof TypeError) {
    // Network error (CORS, DNS, etc.)
    return new ApiError(
      0,
      'Network error: Unable to connect to server. Is the backend running?',
      error.message
    );
  }

  if (error instanceof Error) {
    return new ApiError(0, error.message, error.stack);
  }

  return new ApiError(0, 'An unexpected error occurred');
}

/**
 * Handle Zod validation errors
 * Converts ZodError to ApiError for consistent error handling
 */
function handleZodError(error: z.ZodError): ApiError {
  const message = `Invalid API response: ${formatZodError(error)}`;
  return new ApiError(0, message, JSON.stringify(error.issues));
}

/**
 * Parse and validate API response with Zod schema
 * @throws ApiError if validation fails
 */
async function parseResponse<T>(
  response: Response,
  schema: z.ZodType<T>
): Promise<T> {
  const data: unknown = await response.json();

  // Handle null responses - backend should return 404 instead of 200 with null
  if (data === null) {
    throw new ApiError(
      response.status,
      'Invalid API response: Received null instead of expected data',
      'Backend returned null with 200 status. Should return 404 for missing data.'
    );
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    throw handleZodError(result.error);
  }

  return result.data;
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as ApiError).status === 'number'
  );
}

// ============================================
// API Functions
// ============================================

/**
 * Send an investigation action to the backend
 *
 * @param request - Player action and context
 * @returns LLM narrator response and any discovered evidence
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const response = await investigate({
 *   player_input: "I check under the desk",
 *   case_id: "case_001",
 *   location_id: "library"
 * });
 * console.log(response.narrator_response);
 * console.log(response.new_evidence); // ["hidden_note"]
 * ```
 */
export async function investigate(request: InvestigateRequest): Promise<InvestigateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/investigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, InvestigateResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Save player state to the backend
 *
 * @param playerId - Player identifier
 * @param state - Current investigation state
 * @returns Success status and optional message
 * @throws ApiError if save fails or response validation fails
 *
 * @example
 * ```ts
 * const result = await saveState("player123", {
 *   case_id: "case_001",
 *   current_location: "library",
 *   discovered_evidence: ["hidden_note"],
 *   visited_locations: ["library"]
 * });
 * ```
 */
export async function saveState(
  playerId: string,
  state: InvestigationState
): Promise<SaveResponse> {
  try {
    const request: SaveStateRequest = {
      player_id: playerId,
      state,
    };

    const response = await fetch(`${API_BASE_URL}/api/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, SaveResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Load player state from the backend
 *
 * @param caseId - Case ID to load
 * @param playerId - Player identifier (defaults to "default")
 * @returns Loaded player state or null if not found
 * @throws ApiError if load fails (except 404 which returns null) or response validation fails
 *
 * @example
 * ```ts
 * const state = await loadState("case_001", "player123");
 * if (state) {
 *   console.log(state.discovered_evidence);
 * }
 * ```
 */
export async function loadState(
  caseId: string,
  playerId = 'default',
  slot = 'default',
  locationId?: string
): Promise<LoadResponse | null> {
  try {
    let url = `${API_BASE_URL}/api/load/${caseId}?player_id=${encodeURIComponent(playerId)}&slot=${encodeURIComponent(slot)}`;
    if (locationId) {
      url += `&location_id=${encodeURIComponent(locationId)}`;
    }

    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // 404 means no saved state exists, return null
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw await createApiError(response);
    }

    // Check if response body is null (backend bug: should return 404 instead)
    const data: unknown = await response.json();
    if (data === null) {
      console.warn('Backend returned null with 200 status. Treating as no saved state.');
      return null;
    }

    // Parse the actual data
    const result = LoadResponseSchema.safeParse(data);
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

/**
 * Get discovered evidence for a case
 *
 * @param caseId - Case ID
 * @param playerId - Player identifier (defaults to "default")
 * @returns Evidence data including discovered evidence IDs
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const evidence = await getEvidence("case_001", "player123");
 * console.log(evidence.discovered_evidence); // ["hidden_note", "wand_signature"]
 * ```
 */
export async function getEvidence(
  caseId: string,
  playerId = 'default'
): Promise<EvidenceResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/evidence?case_id=${encodeURIComponent(caseId)}&player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, EvidenceResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Get detailed evidence information
 *
 * @param evidenceId - Evidence ID to fetch
 * @param caseId - Case ID (defaults to "case_001")
 * @returns Evidence details including name, location, and description
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const evidence = await getEvidenceDetails("hidden_note", "case_001");
 * console.log(evidence.name); // "Hidden Note"
 * console.log(evidence.description);
 * ```
 */
export async function getEvidenceDetails(
  evidenceId: string,
  caseId = 'case_001'
): Promise<EvidenceDetails> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/evidence/${encodeURIComponent(evidenceId)}?case_id=${encodeURIComponent(caseId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, EvidenceDetailsSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Get location details for a case
 *
 * @param caseId - Case ID
 * @param locationId - Location ID
 * @returns Location data (name, description, surface elements)
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const location = await getLocation("case_001", "library");
 * console.log(location.name); // "Hogwarts Library - Crime Scene"
 * console.log(location.description);
 * ```
 */
export async function getLocation(
  caseId: string,
  locationId: string
): Promise<LocationResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/location/${encodeURIComponent(locationId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, LocationResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 2: Witness API Functions
// ============================================

/**
 * Interrogate a witness with a question
 *
 * @param request - Witness ID, question, and context
 * @returns Witness response, trust level, and any secrets revealed
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const response = await interrogateWitness({
 *   witness_id: "hermione",
 *   question: "What did you see that night?",
 *   case_id: "case_001"
 * });
 * console.log(response.response);
 * console.log(response.trust); // 55
 * ```
 */
export async function interrogateWitness(
  request: InterrogateRequest
): Promise<InterrogateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interrogate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, InterrogateResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Present evidence to a witness
 *
 * @param request - Witness ID, evidence ID, and context
 * @returns Witness response, trust level, and any secrets revealed
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const response = await presentEvidence({
 *   witness_id: "hermione",
 *   evidence_id: "hidden_note",
 *   case_id: "case_001"
 * });
 * console.log(response.secrets_revealed);
 * ```
 */
export async function presentEvidence(
  request: PresentEvidenceRequest
): Promise<PresentEvidenceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/present-evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, PresentEvidenceResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Get list of available witnesses for a case
 *
 * @param caseId - Case identifier
 * @param playerId - Player identifier (defaults to "default")
 * @returns Array of witness info with current trust levels
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const witnesses = await getWitnesses("case_001");
 * witnesses.forEach(w => console.log(w.name, w.trust));
 * ```
 */
export async function getWitnesses(
  caseId = 'case_001',
  playerId = 'default'
): Promise<WitnessInfo[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/witnesses?case_id=${encodeURIComponent(caseId)}&player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, z.array(WitnessInfoSchema));
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Get single witness details
 *
 * @param witnessId - Witness identifier
 * @param caseId - Case identifier
 * @param playerId - Player identifier (defaults to "default")
 * @returns Witness info with current trust and conversation history
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const witness = await getWitness("hermione", "case_001");
 * console.log(witness.trust, witness.secrets_revealed);
 * ```
 */
export async function getWitness(
  witnessId: string,
  caseId = 'case_001',
  playerId = 'default'
): Promise<WitnessInfo> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/witness/${encodeURIComponent(witnessId)}?case_id=${encodeURIComponent(caseId)}&player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, WitnessInfoSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 3: State Reset API Functions
// ============================================

/**
 * Response from the reset case endpoint
 */
export interface ResetResponse {
  /** Whether the reset was successful */
  success: boolean;
  /** Status message */
  message: string;
}

/**
 * Reset case progress (delete all saved state)
 *
 * @param caseId - Case identifier to reset
 * @param playerId - Player identifier (defaults to "default")
 * @returns Success status and message
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const result = await resetCase("case_001");
 * if (result.success) {
 *   console.log("Case reset successfully");
 * }
 * ```
 */
export async function resetCase(
  caseId: string,
  playerId = 'default'
): Promise<ResetResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/reset?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, ResetResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 5.3: Save/Load with Slots
// ============================================

/**
 * Save game state to a specific slot
 *
 * @param caseId - Case ID to save
 * @param state - Full game state to save
 * @param slot - Save slot (slot_1, slot_2, slot_3, autosave, default)
 * @returns Save confirmation with slot info
 * @throws ApiError if request fails or response validation fails
 */
export async function saveGameState(
  _caseId: string,
  state: InvestigationState,
  slot = 'default'
): Promise<SaveSlotResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/save?slot=${encodeURIComponent(slot)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: 'default',
          state: state,
        }),
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, SaveSlotResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Load game state from a specific slot
 *
 * @param caseId - Case ID to load
 * @param slot - Save slot to load from
 * @returns Loaded game state
 * @throws ApiError if request fails or slot not found or response validation fails
 */
export async function loadGameState(
  caseId: string,
  slot = 'default'
): Promise<InvestigationState> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/load/${encodeURIComponent(caseId)}?slot=${encodeURIComponent(slot)}`
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, InvestigationStateSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * List all save slots with metadata
 *
 * @param caseId - Case ID to list saves for
 * @returns Array of save slot metadata
 * @throws ApiError if request fails or response validation fails
 */
export async function listSaveSlots(
  caseId: string
): Promise<SaveSlotMetadata[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/saves/list`
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    const data = await parseResponse(response, SaveSlotsListResponseSchema);
    return data.saves;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Delete a specific save slot
 *
 * @param caseId - Case ID
 * @param slot - Slot to delete
 * @returns Deletion confirmation
 * @throws ApiError if request fails or response validation fails
 */
export async function deleteSaveSlot(
  caseId: string,
  slot: string
): Promise<DeleteSlotResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/saves/${encodeURIComponent(slot)}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, DeleteSlotResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 3: Verdict API Functions
// ============================================

/**
 * Submit a verdict for case resolution
 *
 * @param request - Verdict submission data (suspect, reasoning, evidence)
 * @returns Verdict result with mentor feedback and optional confrontation
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const response = await submitVerdict({
 *   accused_suspect_id: "draco",
 *   reasoning: "The frost pattern on the wand matches Draco's signature...",
 *   evidence_cited: ["frost_pattern", "wand_signature"],
 *   case_id: "case_001"
 * });
 * if (response.correct) {
 *   console.log("Case solved!", response.confrontation);
 * } else {
 *   console.log("Incorrect:", response.mentor_feedback);
 * }
 * ```
 */
export async function submitVerdict(
  request: SubmitVerdictRequest
): Promise<SubmitVerdictResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/submit-verdict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        case_id: request.case_id ?? 'case_001',
        player_id: request.player_id ?? 'default',
        accused_suspect_id: request.accused_suspect_id,
        reasoning: request.reasoning,
        evidence_cited: request.evidence_cited,
      }),
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, SubmitVerdictResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 3.5: Briefing API Functions
// ============================================

/**
 * Get briefing content for a case
 *
 * @param caseId - Case identifier
 * @param playerId - Player identifier (defaults to "default")
 * @returns Briefing content including case assignment and teaching moment
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const briefing = await getBriefing("case_001");
 * console.log(briefing.case_assignment);
 * console.log(briefing.teaching_moment);
 * ```
 */
export async function getBriefing(
  caseId: string,
  playerId = 'default'
): Promise<BriefingContent> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/briefing/${encodeURIComponent(caseId)}?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, BriefingContentSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Ask Moody a question during briefing
 *
 * @param caseId - Case identifier
 * @param question - Player's question text
 * @param playerId - Player identifier (defaults to "default")
 * @returns Moody's answer
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const response = await askBriefingQuestion("case_001", "What are base rates?");
 * console.log(response.answer);
 * ```
 */
export async function askBriefingQuestion(
  caseId: string,
  question: string,
  playerId = 'default'
): Promise<BriefingQuestionResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/briefing/${encodeURIComponent(caseId)}/question?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, BriefingQuestionResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Mark briefing as complete
 *
 * @param caseId - Case identifier
 * @param playerId - Player identifier (defaults to "default")
 * @returns Success status
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const result = await markBriefingComplete("case_001");
 * if (result.success) {
 *   console.log("Briefing completed");
 * }
 * ```
 */
export async function markBriefingComplete(
  caseId: string,
  playerId = 'default'
): Promise<BriefingCompleteResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/briefing/${encodeURIComponent(caseId)}/complete?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, BriefingCompleteResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 4: Tom's Inner Voice API Functions
// ============================================

/**
 * Check for Tom's inner voice trigger based on evidence count
 *
 * @param caseId - Case identifier
 * @param playerId - Player identifier
 * @param evidenceCount - Current evidence count
 * @returns Inner voice trigger or null if no eligible triggers (404)
 *
 * @example
 * ```ts
 * const trigger = await checkInnerVoice("case_001", "player123", 3);
 * if (trigger) {
 *   console.log(trigger.text); // Tom's message
 *   console.log(trigger.type); // "helpful" or "misleading"
 * }
 * ```
 */
export async function checkInnerVoice(
  caseId: string,
  playerId: string,
  evidenceCount: number
): Promise<InnerVoiceTrigger | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/inner-voice/check`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Player-ID': playerId,
        },
        body: JSON.stringify({ evidence_count: evidenceCount }),
      }
    );

    // 404 means no eligible triggers - return null (not an error)
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, InnerVoiceTriggerSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 4.1: Tom LLM Chat API Functions
// ============================================

/**
 * Check if Tom wants to auto-comment after evidence discovery
 *
 * @param caseId - Case identifier
 * @param playerId - Player identifier
 * @param isCritical - Force Tom to comment (bypasses 30% chance)
 * @returns Tom's response or null if he stays quiet (404)
 *
 * @example
 * ```ts
 * const response = await checkTomAutoComment("case_001", "player123", false);
 * if (response) {
 *   console.log(response.text); // Tom's comment
 *   console.log(response.mode); // "auto_helpful" or "auto_misleading"
 * }
 * ```
 */
export async function checkTomAutoComment(
  caseId: string,
  playerId: string,
  isCritical = false
): Promise<TomResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/tom/auto-comment?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_critical: isCritical }),
      }
    );

    // 404 means Tom stays quiet (not an error)
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, TomResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Send a direct message to Tom ("Tom, what do you think?")
 *
 * @param caseId - Case identifier
 * @param playerId - Player identifier
 * @param message - Player's message to Tom (without "Tom," prefix)
 * @returns Tom's response (always responds, unlike auto-comment)
 *
 * @example
 * ```ts
 * const response = await sendTomChat("case_001", "player123", "should I trust Hermione?");
 * console.log(response.text); // Tom's response
 * console.log(response.trust_level); // Current trust level
 * ```
 */
export async function sendTomChat(
  caseId: string,
  playerId: string,
  message: string
): Promise<TomResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/tom/chat?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, TomResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 5.2: Location Management API Functions
// ============================================

/**
 * Get all available locations for a case
 *
 * @param caseId - Case identifier
 * @param sessionId - Optional session identifier
 * @returns Array of location info for LocationSelector
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const locations = await getLocations("case_001");
 * locations.forEach(loc => console.log(loc.name));
 * ```
 */
export async function getLocations(
  caseId: string,
  sessionId?: string
): Promise<LocationInfo[]> {
  try {
    let url = `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/locations`;

    // Add session_id as query param if provided
    if (sessionId) {
      url += `?session_id=${encodeURIComponent(sessionId)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, z.array(LocationInfoSchema));
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

/**
 * Change player location
 *
 * Changes the player's current location, clearing narrator history
 * while preserving evidence and witness states.
 *
 * @param caseId - Case identifier
 * @param locationId - Target location ID
 * @param playerId - Player identifier (defaults to "default")
 * @param sessionId - Optional session identifier
 * @returns Success status and new location data
 * @throws ApiError if request fails (404 if location not found) or response validation fails
 *
 * @example
 * ```ts
 * const result = await changeLocation("case_001", "dormitory");
 * if (result.success) {
 *   console.log(`Now at: ${result.location.name}`);
 * }
 * ```
 */
export async function changeLocation(
  caseId: string,
  locationId: string,
  playerId = 'default',
  sessionId?: string
): Promise<ChangeLocationResponse> {
  try {
    const body: Record<string, string> = {
      location_id: locationId,
      player_id: playerId,
    };

    if (sessionId) {
      body.session_id = sessionId;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/change-location`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, ChangeLocationResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}

// ============================================
// Phase 5.4: Case Discovery API Functions
// ============================================

/**
 * Get list of available cases with metadata
 *
 * Fetches all valid cases from the backend case_store directory.
 * Backend validates YAML files and returns metadata for display.
 *
 * @returns Case list with metadata, count, and optional errors
 * @throws ApiError if request fails or response validation fails
 *
 * @example
 * ```ts
 * const response = await getCases();
 * console.log(`Found ${response.count} cases`);
 * response.cases.forEach(c => console.log(c.title));
 * if (response.errors) {
 *   console.warn('Some cases failed:', response.errors);
 * }
 * ```
 */
export async function getCases(): Promise<CaseListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cases`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return await parseResponse(response, CaseListResponseSchema);
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}
