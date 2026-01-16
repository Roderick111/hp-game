/**
 * BriefingEngagement Component
 *
 * Final slide of the Briefing Wizard.
 * Allows Q&A with Moody and initiating the investigation.
 *
 * @module components/BriefingEngagement
 */

import { TERMINAL_THEME } from '../styles/terminal-theme';
import { BriefingMessage } from './BriefingMessage';
import type { BriefingConversation } from '../types/investigation';
import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';

interface BriefingEngagementProps {
    conversation: BriefingConversation[];
    transitionText: string;
    onAskQuestion: (question: string) => Promise<void>;
    onComplete: () => void;
    loading: boolean;
}

export function BriefingEngagement({
    conversation,
    transitionText,
    onAskQuestion,
    onComplete,
    loading,
}: BriefingEngagementProps) {
    const [question, setQuestion] = useState('');

    // Core submission logic (no event required)
    const submitQuestion = useCallback(async () => {
        if (!question.trim() || loading) return;

        const q = question;
        setQuestion('');
        try {
            await onAskQuestion(q);
        } catch (err) {
            // Error handling is managed by parent component
            console.error('[BriefingEngagement] Failed to ask question:', err);
        }
    }, [question, loading, onAskQuestion]);

    // Form submit handler
    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            await submitQuestion();
        },
        [submitQuestion]
    );

    // Keyboard handler
    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submitQuestion();
            }
        },
        [submitQuestion]
    );

    return (
        <div className="flex flex-col h-full animate-fadeIn">
            {/* Header Removed (Managed by Parent Window) */}

            {/* Conversation History / Chat Feed */}
            <div className="max-h-80 overflow-y-auto mb-6 pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                {/* Default Start Message */}
                <BriefingMessage
                    speaker="moody"
                    text="Any questions before I send you in, recruit? Don't ask me to solve it for you."
                />

                {conversation.map((msg, i) => (
                    <div key={i} className="animate-fadeIn">
                        <BriefingMessage speaker="player" text={msg.question} />
                        <BriefingMessage speaker="moody" text={msg.answer} />
                    </div>
                ))}

                {loading && (
                    <div className={`flex items-center space-x-2 ${TERMINAL_THEME.typography.helper} p-2`}>
                        <span className="animate-spin">⟳</span>
                        <span>Waiting for response...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="mt-auto">
                <form onSubmit={(e) => void handleSubmit(e)} className="mb-6">
                    <div className={TERMINAL_THEME.components.input.wrapper}>
                        <div className={TERMINAL_THEME.components.input.prefix}>
                            {TERMINAL_THEME.symbols.inputPrefix}
                        </div>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="ask Moody a question..."
                            disabled={loading}
                            rows={3}
                            className={`${TERMINAL_THEME.components.input.field} ${TERMINAL_THEME.components.input.borderDefault}`}
                        />
                        <button
                            type="submit"
                            disabled={loading || !question.trim()}
                            aria-label="Send Message"
                            className={TERMINAL_THEME.components.input.sendButton}
                        >
                            SEND
                        </button>
                    </div>
                </form>

                {/* Transition / Start Button */}
                <div className="border-t border-gray-700 pt-6">
                    <div className="flex flex-col space-y-4">
                        {transitionText && (
                            <div>
                                <div className={`${TERMINAL_THEME.typography.caption} mb-2`}>
                                    FINAL BRIEFING
                                </div>
                                <div className={`${TERMINAL_THEME.typography.body} bg-gray-800/30 p-4 border border-gray-700 rounded leading-relaxed whitespace-pre-wrap`}>
                                    {transitionText}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onComplete}
                            aria-label="Start Investigation"
                            className={`${TERMINAL_THEME.components.button.base} w-full px-8 py-3 bg-amber-900/20 text-amber-500 border-amber-700/50 hover:bg-amber-900/40 hover:text-amber-400 font-bold tracking-widest uppercase transition-all duration-200 group`}
                        >
                            <span className="mr-2 group-hover:mr-4 transition-all">START INVESTIGATION</span>
                            {TERMINAL_THEME.symbols.current}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
