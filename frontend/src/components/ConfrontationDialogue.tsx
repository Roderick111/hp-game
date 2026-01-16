/**
 * ConfrontationDialogue Component
 *
 * Displays post-verdict confrontation dialogue:
 * - Dialogue bubbles with speaker color coding
 * - Tone indicators for emotional context
 * - Aftermath text describing consequences
 * - Case solved celebration banner
 *
 * @module components/ConfrontationDialogue
 * @since Phase 3
 */

import { TERMINAL_THEME } from '../styles/terminal-theme';

// ============================================
// Types
// ============================================

export interface DialogueLine {
  speaker: string;
  text: string;
  tone?: string;
}

export interface ConfrontationDialogueData {
  dialogue: DialogueLine[];
  aftermath: string;
}

export interface ConfrontationDialogueProps {
  /** Dialogue data */
  dialogue: DialogueLine[];
  /** Aftermath description */
  aftermath: string;
  /** Callback when dialogue is closed */
  onClose: () => void;
  /** Whether case was solved correctly (vs revealed after max attempts) */
  caseSolvedCorrectly?: boolean;
}

// ============================================
// Helper Functions
// ============================================

function getSpeakerColor(speaker: string): string {
  const speakerLower = speaker.toLowerCase();
  const theme = TERMINAL_THEME.colors.character;
  if (speakerLower === "moody") return theme.detective.text;
  if (speakerLower === "player" || speakerLower === "you")
    return theme.detective.text;
  // Suspects/culprits use witness coloring
  return theme.witness.text;
}

function getSpeakerBorder(speaker: string): string {
  const speakerLower = speaker.toLowerCase();
  const theme = TERMINAL_THEME.colors.character;
  if (speakerLower === "moody") return theme.detective.border;
  if (speakerLower === "player" || speakerLower === "you")
    return theme.detective.border;
  // Suspects/culprits use witness coloring
  return theme.witness.border;
}

// ============================================
// Sub-components
// ============================================

interface DialogueBubbleProps {
  line: DialogueLine;
}

function DialogueBubble({ line }: DialogueBubbleProps) {
  return (
    <div
      className={`border-l-2 ${getSpeakerBorder(line.speaker)} pl-4 py-3 mb-4`}
    >
      {/* Speaker name and tone */}
      <div
        className={`text-xs font-bold mb-1.5 tracking-widest uppercase ${getSpeakerColor(line.speaker)}`}
      >
        {TERMINAL_THEME.speakers.witness.format(line.speaker)}
        {line.tone && (
          <span className="text-gray-600 font-normal ml-2 lowercase">
            [{line.tone}]
          </span>
        )}
      </div>

      {/* Dialogue text */}
      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
        {line.text}
      </p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ConfrontationDialogue({
  dialogue,
  aftermath,
  onClose,
  caseSolvedCorrectly = true,
}: ConfrontationDialogueProps) {
  const successTheme = TERMINAL_THEME.colors.state.success;

  return (
    <div className="font-mono">
      {/* Case Solved Banner */}
      <div
        className={`p-5 text-center border-2 mb-10 ${caseSolvedCorrectly
            ? `${successTheme.bg} ${successTheme.border}`
            : `${TERMINAL_THEME.colors.bg.primary} ${TERMINAL_THEME.colors.border.default}`
          }`}
      >
        <div
          className={`text-xl font-bold tracking-widest uppercase mb-2 ${caseSolvedCorrectly ? successTheme.text : TERMINAL_THEME.colors.text.secondary
            }`}
        >
          {caseSolvedCorrectly
            ? `${TERMINAL_THEME.symbols.block} CASE SOLVED ${TERMINAL_THEME.symbols.block}`
            : `${TERMINAL_THEME.symbols.bullet} CASE RESOLVED ${TERMINAL_THEME.symbols.bullet}`}
        </div>
        <div
          className={`text-xs tracking-wide uppercase ${caseSolvedCorrectly ? "text-green-300/90" : TERMINAL_THEME.colors.text.muted
            }`}
        >
          {caseSolvedCorrectly
            ? `${TERMINAL_THEME.symbols.checkmark} JUSTICE HAS BEEN SERVED. EXCELLENT WORK, AUROR! ${TERMINAL_THEME.symbols.checkmark}`
            : "Case resolved. Review evidence for future cases."}
        </div>
      </div>

      {/* Dialogue Bubbles */}
      <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 mb-10">
        {dialogue.map((line, idx) => (
          <DialogueBubble key={idx} line={line} />
        ))}
      </div>

      {/* Aftermath */}
      {aftermath && (
        <div className="pt-6 border-t border-gray-800 mb-10">
          <h3 className={`${TERMINAL_THEME.typography.caption} mb-3 text-center`}>
            {TERMINAL_THEME.speakers.witness.format('Aftermath')}
          </h3>
          <p className="text-sm text-gray-400 italic leading-relaxed whitespace-pre-wrap text-center">
            {aftermath}
          </p>
        </div>
      )}

      {/* Close Button - Terminal style */}
      <button
        onClick={onClose}
        className={TERMINAL_THEME.components.button.terminalAction + " w-full justify-center"}
      >
        <span className="font-bold">
          {TERMINAL_THEME.symbols.doubleArrowRight} CLOSE CASE FILE
        </span>
      </button>
    </div>
  );
}
