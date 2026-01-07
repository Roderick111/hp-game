/**
 * BriefingMessage Component
 *
 * Simple message bubble for dialogue-based briefing UI.
 * Displays speaker name (MOODY or YOU) and text content.
 *
 * @module components/BriefingMessage
 * @since Phase 3.6
 */

export interface BriefingMessageProps {
  /** Speaker of the message */
  speaker: 'moody' | 'player';
  /** Message text content */
  text: string;
}

export function BriefingMessage({ speaker, text }: BriefingMessageProps) {
  const isMoody = speaker === 'moody';

  return (
    <div className={`mb-4 ${isMoody ? '' : 'ml-8'}`}>
      <div className="text-xs font-bold mb-1">
        {isMoody ? (
          <span className="text-amber-400">MOODY:</span>
        ) : (
          <span className="text-gray-400">YOU:</span>
        )}
      </div>
      <div
        className={`text-sm ${isMoody ? 'text-gray-300' : 'text-gray-400'} whitespace-pre-wrap leading-relaxed`}
      >
        {text}
      </div>
    </div>
  );
}
