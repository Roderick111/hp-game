/**
 * BriefingQuestion Component
 *
 * Displays a single teaching question slide with multiple choice inputs.
 * Part of the Briefing Wizard.
 *
 * @module components/BriefingQuestion
 */

import { TERMINAL_THEME } from '../styles/terminal-theme';
import type { TeachingQuestion } from '../types/investigation';

interface BriefingQuestionProps {
    /** Current teaching question to display */
    question: TeachingQuestion;
    /** Callback when player selects a choice */
    onSelectChoice: (choiceId: string) => void;
    /** Currently selected choice ID (null if none selected) */
    selectedChoiceId: string | null;
    /** Moody's response to the selected choice */
    choiceResponse: string | null;
    /** Callback when player continues to next step */
    onContinue: () => void;
}

export function BriefingQuestion({
    question,
    onSelectChoice,
    selectedChoiceId,
    choiceResponse,
    onContinue,
}: BriefingQuestionProps) {

    return (
        <div className="flex flex-col h-full animate-fadeIn">
            {/* Header Removed (Managed by Parent Window) */}

            {/* Question Prompt */}
            <div className="mb-8 p-4 bg-gray-800/30 border-l-2 border-gray-600">
                <div className={`${TERMINAL_THEME.typography.caption} mb-2`}>
                    MOODY'S QUERY:
                </div>
                <div className={TERMINAL_THEME.typography.body}>
                    "{question.prompt}"
                </div>
            </div>

            {/* Choices Grid */}
            <div className="grid grid-cols-1 gap-4 mb-8">
                {question.choices.map((choice) => {
                    const isSelected = selectedChoiceId === choice.id;
                    const isDimmed = selectedChoiceId !== null && !isSelected;

                    return (
                        <button
                            key={choice.id}
                            onClick={() => !selectedChoiceId && onSelectChoice(choice.id)}
                            disabled={selectedChoiceId !== null}
                            aria-pressed={isSelected}
                            aria-label={`Choice ${String.fromCharCode(65 + question.choices.indexOf(choice))}: ${choice.text}`}
                            className={`
                text-left p-4 border rounded transition-all duration-200
                ${isSelected
                                    ? 'bg-gray-800 border-gray-500'
                                    : 'bg-gray-800/50 border-gray-600 hover:border-amber-500 hover:text-amber-400 hover:bg-gray-800'
                                }
                ${isDimmed ? 'opacity-40 grayscale' : ''}
              `}
                        >
                            <div className="flex items-start">
                                <span className={`${TERMINAL_THEME.typography.caption} mr-3 mt-0.5`}>
                                    [{String.fromCharCode(65 + question.choices.indexOf(choice))}]
                                </span>
                                <span className={TERMINAL_THEME.typography.body}>{choice.text}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Feedback & Continue */}
            {selectedChoiceId && (
                <div className="mt-auto animate-fadeIn">
                    {/* Moody's Response */}
                    {choiceResponse && (
                        <div className="mb-4 p-4 bg-gray-900 border border-gray-700">
                            <span className={`${TERMINAL_THEME.typography.caption} mr-2`}>MOODY:</span>
                            <span className={TERMINAL_THEME.typography.body}>{choiceResponse}</span>
                        </div>
                    )}

                    {/* Concept Summary */}
                    <div className="mb-6 p-4 border-l-2 border-gray-600 bg-gray-800/30">
                        <div className={`${TERMINAL_THEME.typography.caption} mb-1`}>
                            CORE CONCEPT: {question.concept_summary}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={onContinue}
                            className={`${TERMINAL_THEME.components.button.base} w-auto px-8 py-3 bg-amber-900/20 text-amber-500 border-amber-700/50 hover:bg-amber-900/40 hover:text-amber-400 font-bold tracking-widest uppercase transition-all duration-200 group`}
                        >
                            <span className="mr-2 group-hover:mr-4 transition-all">PROCEED</span>
                            {TERMINAL_THEME.symbols.current}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
