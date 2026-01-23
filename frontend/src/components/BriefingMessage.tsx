/**
 * BriefingMessage Component
 *
 * Simple message bubble for dialogue-based briefing UI.
 * Displays speaker name (MOODY or YOU) and text content.
 *
 * @module components/BriefingMessage
 * @since Phase 3.6
 */

import { useTheme } from '../context/ThemeContext';

export interface BriefingMessageProps {
  /** Speaker of the message */
  speaker: 'moody' | 'player';
  /** Message text content */
  text: string;
}

export function BriefingMessage({ speaker, text }: BriefingMessageProps) {
  const { theme } = useTheme();
  const isMoody = speaker === 'moody';

  // Use narrator style for Moody (mentor), player style for player
  const wrapperClass = isMoody
    ? theme.components.message.narrator.wrapper
    : theme.components.message.player.wrapper;

  const textClass = isMoody
    ? theme.components.message.narrator.text
    : theme.components.message.player.text;

  return (
    <div className={wrapperClass}>
      <p className={textClass}>
        {!isMoody && <span className={theme.components.message.player.prefix}>{theme.symbols.inputPrefix}</span>}
        {text}
      </p>
    </div>
  );
}
