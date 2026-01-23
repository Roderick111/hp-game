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

import { useTheme } from '../context/ThemeContext';
import type { TerminalTheme } from '../styles/terminal-theme';

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

function getSpeakerColor(speaker: string, theme: TerminalTheme): string {
  const speakerLower = speaker.toLowerCase();
  const charTheme = theme.colors.character;
  if (speakerLower === "moody") return charTheme.detective.text;
  if (speakerLower === "player" || speakerLower === "you")
    return charTheme.detective.text;
  // Suspects/culprits use witness coloring
  return charTheme.witness.text;
}

function getSpeakerBorder(speaker: string, theme: TerminalTheme): string {
  const speakerLower = speaker.toLowerCase();
  const charTheme = theme.colors.character;
  if (speakerLower === "moody") return charTheme.detective.border;
  if (speakerLower === "player" || speakerLower === "you")
    return charTheme.detective.border;
  // Suspects/culprits use witness coloring
  return charTheme.witness.border;
}

// ============================================
// Sub-components
// ============================================

interface DialogueBubbleProps {
  line: DialogueLine;
  theme: TerminalTheme;
}

function DialogueBubble({ line, theme }: DialogueBubbleProps) {
  return (
    <div
      className={`border-l-2 ${getSpeakerBorder(line.speaker, theme)} pl-4 py-3 mb-4`}
    >
      {/* Speaker name and tone */}
      <div
        className={`text-xs font-bold mb-1.5 tracking-widest uppercase ${getSpeakerColor(line.speaker, theme)}`}
      >
        {theme.speakers.witness.format(line.speaker)}
        {line.tone && (
          <span className={`${theme.colors.text.muted} font-normal ml-2 lowercase`}>
            [{line.tone}]
          </span>
        )}
      </div>

      {/* Dialogue text */}
      <p className={`text-sm ${theme.colors.text.secondary} leading-relaxed whitespace-pre-wrap`}>
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
  const { theme } = useTheme();
  const successTheme = theme.colors.state.success;

  return (
    <div className="font-mono">
      {/* Case Solved Banner */}
      <div
        className={`p-5 text-center border-2 mb-10 ${caseSolvedCorrectly
            ? `${successTheme.bg} ${successTheme.border}`
            : `${theme.colors.bg.primary} ${theme.colors.border.default}`
          }`}
      >
        <div
          className={`text-xl font-bold tracking-widest uppercase mb-2 ${caseSolvedCorrectly ? successTheme.text : theme.colors.text.secondary
            }`}
        >
          {caseSolvedCorrectly
            ? `${theme.symbols.block} CASE SOLVED ${theme.symbols.block}`
            : `${theme.symbols.bullet} CASE RESOLVED ${theme.symbols.bullet}`}
        </div>
        <div
          className={`text-xs tracking-wide uppercase ${caseSolvedCorrectly ? successTheme.text : theme.colors.text.muted
            }`}
        >
          {caseSolvedCorrectly
            ? `${theme.symbols.checkmark} JUSTICE HAS BEEN SERVED. EXCELLENT WORK, AUROR! ${theme.symbols.checkmark}`
            : "Case resolved. Review evidence for future cases."}
        </div>
      </div>

      {/* Dialogue Bubbles */}
      <div className="mb-10">
        {dialogue.map((line, idx) => (
          <DialogueBubble key={idx} line={line} theme={theme} />
        ))}
      </div>

      {/* Aftermath */}
      {aftermath && (
        <div className={`pt-6 border-t ${theme.colors.border.default} mb-10`}>
          <h3 className={`${theme.typography.caption} mb-3 text-center`}>
            {theme.speakers.witness.format('Aftermath')}
          </h3>
          <p className={`text-sm ${theme.colors.text.tertiary} italic leading-relaxed whitespace-pre-wrap text-center`}>
            {aftermath}
          </p>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full py-3 px-4 bg-blue-600 border border-blue-700 text-white font-mono uppercase tracking-widest text-sm hover:bg-blue-700 transition-all duration-200 group flex items-center justify-center"
      >
        <span>CLOSE CASE FILE</span>
        <span className="ml-2 group-hover:translate-x-2 transition-transform duration-200">{theme.symbols.arrowRight}</span>
      </button>
    </div>
  );
}
