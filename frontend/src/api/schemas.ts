/**
 * Zod Runtime Validation Schemas for API Responses
 *
 * This module provides runtime validation for all API responses
 * to ensure type safety beyond compile-time TypeScript checks.
 *
 * All schemas use .strict() to catch unexpected properties.
 *
 * @module api/schemas
 * @since Phase 5.8 - Runtime Validation
 */

import { z } from 'zod';

// ============================================
// Helper for parsing Zod errors to ApiError format
// ============================================

/**
 * Formats a ZodError into a human-readable string
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
}

// ============================================
// Base/Shared Schemas
// ============================================

/**
 * Schema for ConversationMessage (used in LoadResponse)
 */
export const ConversationMessageSchema = z
  .object({
    type: z.enum(['player', 'narrator', 'tom']),
    text: z.string(),
    timestamp: z.number(),
  })
  .strict();

export type ConversationMessageFromSchema = z.infer<typeof ConversationMessageSchema>;

// ============================================
// Phase 1: Core Investigation Schemas
// ============================================

/**
 * Schema for InvestigateResponse
 * Runtime validation for POST /api/investigate
 */
export const InvestigateResponseSchema = z
  .object({
    narrator_response: z.string(),
    new_evidence: z.array(z.string()),
    already_discovered: z.boolean(),
  })
  .strict();

export type InvestigateResponseFromSchema = z.infer<typeof InvestigateResponseSchema>;

/**
 * Schema for SaveResponse
 * Runtime validation for POST /api/save
 */
export const SaveResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
  })
  .strict();

export type SaveResponseFromSchema = z.infer<typeof SaveResponseSchema>;

/**
 * Schema for LoadResponse
 * Runtime validation for GET /api/load/{case_id}
 */
export const LoadResponseSchema = z
  .object({
    case_id: z.string(),
    current_location: z.string(),
    discovered_evidence: z.array(z.string()),
    visited_locations: z.array(z.string()),
    conversation_history: z.array(ConversationMessageSchema).optional(),
  })
  .strict();

export type LoadResponseFromSchema = z.infer<typeof LoadResponseSchema>;

/**
 * Schema for EvidenceResponse
 * Runtime validation for GET /api/evidence
 */
export const EvidenceResponseSchema = z
  .object({
    case_id: z.string(),
    discovered_evidence: z.array(z.string()),
  })
  .strict();

export type EvidenceResponseFromSchema = z.infer<typeof EvidenceResponseSchema>;

/**
 * Schema for EvidenceDetails
 * Runtime validation for GET /api/evidence/{id}
 */
export const EvidenceDetailsSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    location_found: z.string(),
    description: z.string(),
  })
  .strict();

export type EvidenceDetailsFromSchema = z.infer<typeof EvidenceDetailsSchema>;

/**
 * Schema for LocationResponse
 * Runtime validation for GET /api/case/{case_id}/location/{location_id}
 */
export const LocationResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    surface_elements: z.array(z.string()),
    witnesses_present: z.array(z.string()).optional(),
  })
  .strict();

export type LocationResponseFromSchema = z.infer<typeof LocationResponseSchema>;

// ============================================
// Phase 2: Witness Schemas
// ============================================

/**
 * Schema for WitnessConversationItem
 */
export const WitnessConversationItemSchema = z
  .object({
    question: z.string(),
    response: z.string(),
    timestamp: z.string(),
    trust_delta: z.number().optional(),
  })
  .strict();

export type WitnessConversationItemFromSchema = z.infer<typeof WitnessConversationItemSchema>;

/**
 * Schema for WitnessInfo
 * Runtime validation for GET /api/witness/{id} and GET /api/witnesses
 */
export const WitnessInfoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    personality: z.string().nullable().optional(),
    trust: z.number(),
    conversation_history: z.array(WitnessConversationItemSchema).optional(),
    secrets_revealed: z.array(z.string()),
    image_url: z.string().nullable().optional(),
  })
  .strict();

export type WitnessInfoFromSchema = z.infer<typeof WitnessInfoSchema>;

/**
 * Schema for InterrogateResponse
 * Runtime validation for POST /api/interrogate
 */
export const InterrogateResponseSchema = z
  .object({
    response: z.string(),
    trust: z.number(),
    trust_delta: z.number().optional(),
    secrets_revealed: z.array(z.string()).optional(),
    secret_texts: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export type InterrogateResponseFromSchema = z.infer<typeof InterrogateResponseSchema>;

/**
 * Schema for PresentEvidenceResponse
 * Runtime validation for POST /api/present-evidence
 */
export const PresentEvidenceResponseSchema = z
  .object({
    response: z.string(),
    trust: z.number(),
    trust_delta: z.number().optional(),
    secrets_revealed: z.array(z.string()).optional(),
  })
  .strict();

export type PresentEvidenceResponseFromSchema = z.infer<typeof PresentEvidenceResponseSchema>;

// ============================================
// Phase 3: Verdict Schemas
// ============================================

/**
 * Schema for Fallacy
 */
export const FallacySchema = z
  .object({
    name: z.string(),
    description: z.string(),
    example: z.string(),
  })
  .strict();

export type FallacyFromSchema = z.infer<typeof FallacySchema>;

/**
 * Schema for MentorFeedbackData
 */
export const MentorFeedbackDataSchema = z
  .object({
    analysis: z.string(),
    fallacies_detected: z.array(FallacySchema),
    score: z.number(),
    quality: z.string(),
    critique: z.string(),
    praise: z.string(),
    hint: z.string().optional(),
  })
  .strict();

export type MentorFeedbackDataFromSchema = z.infer<typeof MentorFeedbackDataSchema>;

/**
 * Schema for DialogueLine
 */
export const DialogueLineSchema = z
  .object({
    speaker: z.string(),
    text: z.string(),
    tone: z.string().optional(),
  })
  .strict();

export type DialogueLineFromSchema = z.infer<typeof DialogueLineSchema>;

/**
 * Schema for ConfrontationDialogueData
 */
export const ConfrontationDialogueDataSchema = z
  .object({
    dialogue: z.array(DialogueLineSchema),
    aftermath: z.string(),
  })
  .strict();

export type ConfrontationDialogueDataFromSchema = z.infer<typeof ConfrontationDialogueDataSchema>;

/**
 * Schema for SubmitVerdictResponse
 * Runtime validation for POST /api/submit-verdict
 */
export const SubmitVerdictResponseSchema = z
  .object({
    correct: z.boolean(),
    attempts_remaining: z.number(),
    case_solved: z.boolean(),
    mentor_feedback: MentorFeedbackDataSchema,
    confrontation: ConfrontationDialogueDataSchema.optional(),
    reveal: z.string().optional(),
    wrong_suspect_response: z.string().optional(),
  })
  .strict();

export type SubmitVerdictResponseFromSchema = z.infer<typeof SubmitVerdictResponseSchema>;

// ============================================
// Phase 3.5: Briefing Schemas
// ============================================

/**
 * Schema for TeachingChoice
 */
export const TeachingChoiceSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    response: z.string(),
  })
  .strict();

export type TeachingChoiceFromSchema = z.infer<typeof TeachingChoiceSchema>;

/**
 * Schema for TeachingQuestion
 */
export const TeachingQuestionSchema = z
  .object({
    prompt: z.string(),
    choices: z.array(TeachingChoiceSchema),
    concept_summary: z.string(),
  })
  .strict();

export type TeachingQuestionFromSchema = z.infer<typeof TeachingQuestionSchema>;

/**
 * Schema for CaseDossier
 */
export const CaseDossierSchema = z
  .object({
    title: z.string(),
    victim: z.string(),
    location: z.string(),
    time: z.string(),
    status: z.string(),
    synopsis: z.string(),
  })
  .strict();

export type CaseDossierFromSchema = z.infer<typeof CaseDossierSchema>;

/**
 * Schema for BriefingContent
 * Runtime validation for GET /api/briefing/{case_id}
 */
export const BriefingContentSchema = z
  .object({
    case_id: z.string(),
    dossier: CaseDossierSchema,
    teaching_questions: z.array(TeachingQuestionSchema),
    transition: z.string().optional(),
    briefing_completed: z.boolean(),
    // Deprecated fields (optional for backward compatibility)
    case_assignment: z.string().optional(),
    teaching_question: TeachingQuestionSchema.optional(),
    rationality_concept: z.string().optional(),
    concept_description: z.string().optional(),
  })
  .strict();

export type BriefingContentFromSchema = z.infer<typeof BriefingContentSchema>;

/**
 * Schema for BriefingQuestionResponse
 * Runtime validation for POST /api/briefing/{case_id}/question
 */
export const BriefingQuestionResponseSchema = z
  .object({
    answer: z.string(),
  })
  .strict();

export type BriefingQuestionResponseFromSchema = z.infer<typeof BriefingQuestionResponseSchema>;

/**
 * Schema for BriefingCompleteResponse
 * Runtime validation for POST /api/briefing/{case_id}/complete
 */
export const BriefingCompleteResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .strict();

export type BriefingCompleteResponseFromSchema = z.infer<typeof BriefingCompleteResponseSchema>;

// ============================================
// Phase 4: Tom's Inner Voice Schemas
// ============================================

/**
 * Schema for TomTriggerType
 */
export const TomTriggerTypeSchema = z.enum([
  'helpful',
  'misleading',
  'self_aware',
  'dark_humor',
  'emotional',
]);

/**
 * Schema for InnerVoiceTrigger
 * Runtime validation for POST /api/case/{case_id}/inner-voice/check
 */
export const InnerVoiceTriggerSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    type: TomTriggerTypeSchema,
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .strict();

export type InnerVoiceTriggerFromSchema = z.infer<typeof InnerVoiceTriggerSchema>;

/**
 * Schema for TomResponse
 * Runtime validation for Tom LLM endpoints (auto-comment and direct chat)
 */
export const TomResponseSchema = z
  .object({
    text: z.string(),
    mode: z.string(),
    trust_level: z.number(),
  })
  .strict();

export type TomResponseFromSchema = z.infer<typeof TomResponseSchema>;

// ============================================
// Phase 5.2: Location Management Schemas
// ============================================

/**
 * Schema for LocationInfo
 * Runtime validation for GET /api/case/{case_id}/locations
 */
export const LocationInfoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  })
  .strict();

export type LocationInfoFromSchema = z.infer<typeof LocationInfoSchema>;

/**
 * Schema for ChangeLocationResponse
 * Runtime validation for POST /api/case/{case_id}/change-location
 */
export const ChangeLocationResponseSchema = z
  .object({
    success: z.boolean(),
    location: z
      .object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
      .strict(),
    message: z.string().optional(),
  })
  .strict();

export type ChangeLocationResponseFromSchema = z.infer<typeof ChangeLocationResponseSchema>;

// ============================================
// Phase 5.3: Save/Load System Schemas
// ============================================

/**
 * Schema for SaveSlotMetadata
 */
export const SaveSlotMetadataSchema = z
  .object({
    slot: z.string(),
    case_id: z.string(),
    timestamp: z.string(),
    location: z.string(),
    evidence_count: z.number(),
    version: z.string(),
  })
  .strict();

export type SaveSlotMetadataFromSchema = z.infer<typeof SaveSlotMetadataSchema>;

/**
 * Schema for SaveSlotsListResponse
 * Runtime validation for GET /api/case/{case_id}/saves/list
 */
export const SaveSlotsListResponseSchema = z
  .object({
    saves: z.array(SaveSlotMetadataSchema),
  })
  .strict();

export type SaveSlotsListResponseFromSchema = z.infer<typeof SaveSlotsListResponseSchema>;

/**
 * Schema for SaveSlotResponse
 * Runtime validation for POST /api/save (with slot)
 */
export const SaveSlotResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    slot: z.string(),
  })
  .strict();

export type SaveSlotResponseFromSchema = z.infer<typeof SaveSlotResponseSchema>;

/**
 * Schema for DeleteSlotResponse
 * Runtime validation for DELETE /api/case/{case_id}/saves/{slot}
 */
export const DeleteSlotResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .strict();

export type DeleteSlotResponseFromSchema = z.infer<typeof DeleteSlotResponseSchema>;

// ============================================
// Phase 5.3.1: Landing Page Schemas
// ============================================

/**
 * Schema for ApiCaseMetadata
 */
export const ApiCaseMetadataSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    description: z.string(),
  })
  .strict();

export type ApiCaseMetadataFromSchema = z.infer<typeof ApiCaseMetadataSchema>;

/**
 * Schema for CaseListResponse
 * Runtime validation for GET /api/cases
 */
export const CaseListResponseSchema = z
  .object({
    cases: z.array(ApiCaseMetadataSchema),
    count: z.number(),
    errors: z.array(z.string()).nullable().optional(),
  })
  .strict();

export type CaseListResponseFromSchema = z.infer<typeof CaseListResponseSchema>;

// ============================================
// Phase 3: Reset Case Response Schema
// ============================================

/**
 * Schema for ResetResponse
 * Runtime validation for POST /api/case/{case_id}/reset
 */
export const ResetResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .strict();

export type ResetResponseFromSchema = z.infer<typeof ResetResponseSchema>;

// ============================================
// Investigation State Schema (for loadGameState)
// ============================================

/**
 * Schema for InvestigationState
 * Used when loading raw game state (not LoadResponse)
 */
export const InvestigationStateSchema = z
  .object({
    case_id: z.string(),
    current_location: z.string(),
    discovered_evidence: z.array(z.string()),
    visited_locations: z.array(z.string()),
  })
  .strict();

export type InvestigationStateFromSchema = z.infer<typeof InvestigationStateSchema>;
