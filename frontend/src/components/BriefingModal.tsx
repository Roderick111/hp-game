/**
 * BriefingModal Component
 *
 * Dialogue-based briefing UI for Moody's case introduction:
 * - Single flowing dialogue feed (no separated boxes)
 * - Interactive teaching question with multiple choice
 * - Q&A conversation at bottom
 * - Text input for follow-up questions
 *
 * @module components/BriefingModal
 * @since Phase 3.6
 */

import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { BriefingMessage } from './BriefingMessage';
import type {
  BriefingContent,
  BriefingConversation as BriefingConversationType,
} from '../types/investigation';

// ============================================
// Types
// ============================================

export interface BriefingModalProps {
  /** Briefing content from backend */
  briefing: BriefingContent;
  /** Q&A conversation history */
  conversation: BriefingConversationType[];
  /** Selected choice ID (null if not yet answered) */
  selectedChoice: string | null;
  /** Moody's response to selected choice */
  choiceResponse: string | null;
  /** Callback when player selects a choice */
  onSelectChoice: (choiceId: string) => void;
  /** Callback when player asks a question */
  onAskQuestion: (question: string) => Promise<void>;
  /** Callback when player clicks "Start Investigation" */
  onComplete: () => void;
  /** Whether an API call is in progress */
  loading: boolean;
}

// ============================================
// Component
// ============================================

export function BriefingModal({
  briefing,
  conversation,
  selectedChoice,
  choiceResponse,
  onSelectChoice,
  onAskQuestion,
  onComplete,
  loading,
}: BriefingModalProps) {
  const [question, setQuestion] = useState('');

  // Handle question submission
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!question.trim() || loading) {
        return;
      }

      const currentQuestion = question.trim();
      setQuestion('');
      await onAskQuestion(currentQuestion);
    },
    [question, loading, onAskQuestion]
  );

  // Handle Ctrl+Enter to submit
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        void handleSubmit(e as unknown as FormEvent);
      }
    },
    [handleSubmit]
  );

  // Find selected choice text for display
  const selectedChoiceText = briefing.teaching_question.choices.find(
    (c) => c.id === selectedChoice
  )?.text;

  return (
    <div className="bg-gray-900 rounded-lg p-6 font-mono max-h-[80vh] overflow-y-auto">
      {/* Dialogue Feed */}
      <div className="space-y-2">
        {/* Case Assignment */}
        <BriefingMessage speaker="moody" text={briefing.case_assignment} />

        {/* Teaching Question Prompt */}
        <BriefingMessage speaker="moody" text={briefing.teaching_question.prompt} />

        {/* Choice Buttons (if not answered) */}
        {!selectedChoice && (
          <div className="flex flex-wrap gap-2 ml-8 my-4">
            {briefing.teaching_question.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onSelectChoice(choice.id)}
                disabled={loading}
                className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-amber-400 font-bold py-2 px-4 rounded border border-gray-600 hover:border-amber-500 transition-colors text-sm"
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}

        {/* Player's Choice + Moody's Response (if answered) */}
        {selectedChoice && selectedChoiceText && (
          <>
            <BriefingMessage speaker="player" text={`My answer: ${selectedChoiceText}`} />
            {choiceResponse && (
              <>
                <BriefingMessage speaker="moody" text={choiceResponse} />
                <BriefingMessage
                  speaker="moody"
                  text={briefing.teaching_question.concept_summary}
                />
              </>
            )}
          </>
        )}

        {/* Conversation History */}
        {conversation.map((msg, i) => (
          <div key={i}>
            <BriefingMessage speaker="player" text={msg.question} />
            <BriefingMessage speaker="moody" text={msg.answer} />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 my-6" />

      {/* Text Input Section */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Mad-Eye a question..."
          disabled={loading}
          rows={2}
          className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50 resize-none"
          aria-label="Question for Moody"
        />
        <div className="flex justify-between items-center gap-4">
          <p className="text-xs text-gray-600">Press Ctrl+Enter to submit</p>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-2 px-6 rounded transition-colors text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    aria-hidden="true"
                  />
                  Asking...
                </span>
              ) : (
                'Ask'
              )}
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={loading}
              className="bg-amber-700 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 px-6 rounded transition-colors text-sm uppercase tracking-wider"
            >
              Start Investigation
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
