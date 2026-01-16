/**
 * BriefingMessage Component
 *
 * Simple message bubble for dialogue-based briefing UI.
 * Displays speaker name (MOODY or YOU) and text content.
 *
 * @module components/BriefingMessage
 * @since Phase 3.6
 */

import { TERMINAL_THEME } from '../styles/terminal-theme';

export interface BriefingMessageProps {
  /** Speaker of the message */
  speaker: 'moody' | 'player';
  /** Message text content */
  text: string;
}

export function BriefingMessage({ speaker, text }: BriefingMessageProps) {
  const isMoody = speaker === 'moody';

  // Use narrator style for Moody (mentor), player style for player
  const wrapperClass = isMoody
    ? TERMINAL_THEME.components.message.narrator.wrapper
    : TERMINAL_THEME.components.message.player.wrapper;

  const textClass = isMoody
    ? TERMINAL_THEME.components.message.narrator.text
    : TERMINAL_THEME.components.message.player.text;

  return (
    <div className={wrapperClass}>
      <p className={textClass}>
        {!isMoody && <span className={TERMINAL_THEME.components.message.player.prefix}>{TERMINAL_THEME.symbols.inputPrefix}</span>}
        {text}
      </p>
    </div>
  );
}
