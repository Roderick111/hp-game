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

// ============================================
// Types
// ============================================

export interface DialogueLine {
  speaker: string;
  text: string;
  tone?: 'defiant' | 'remorseful' | 'broken' | 'angry' | 'resigned' | string;
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
  if (speakerLower === 'moody') return 'text-amber-400';
  if (speakerLower === 'player' || speakerLower === 'you') return 'text-blue-400';
  // Default to red for suspects/culprits
  return 'text-red-400';
}

function getSpeakerBgClass(speaker: string): string {
  const speakerLower = speaker.toLowerCase();
  if (speakerLower === 'moody') {
    return 'bg-amber-900/30 border-amber-700';
  }
  if (speakerLower === 'player' || speakerLower === 'you') {
    return 'bg-blue-900/30 border-blue-700';
  }
  // Default to red for suspects/culprits
  return 'bg-red-900/30 border-red-700';
}

function formatSpeakerName(speaker: string): string {
  return speaker.charAt(0).toUpperCase() + speaker.slice(1);
}

function getToneEmoji(tone?: string): string {
  if (!tone) return '';
  const tones: Record<string, string> = {
    defiant: '',
    remorseful: '',
    broken: '',
    angry: '',
    resigned: '',
  };
  return tones[tone] || '';
}

// ============================================
// Sub-components
// ============================================

interface DialogueBubbleProps {
  line: DialogueLine;
}

function DialogueBubble({ line }: DialogueBubbleProps) {
  const isPlayer = line.speaker.toLowerCase() === 'player' || line.speaker.toLowerCase() === 'you';

  return (
    <div className={`${isPlayer ? 'text-right' : 'text-left'}`}>
      <div
        className={`inline-block max-w-[85%] p-3 rounded border ${getSpeakerBgClass(line.speaker)}`}
      >
        {/* Speaker name and tone */}
        <div className={`text-xs font-bold mb-1 ${getSpeakerColor(line.speaker)}`}>
          {formatSpeakerName(line.speaker)}
          {line.tone && (
            <span className="text-gray-500 font-normal ml-1">
              ({line.tone}) {getToneEmoji(line.tone)}
            </span>
          )}
        </div>

        {/* Dialogue text */}
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {line.text}
        </p>
      </div>
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
  return (
    <div className="bg-gray-900 border border-amber-700 rounded-lg p-6 font-mono">
      {/* Header */}
      <h2 className="text-xl font-bold text-amber-400 mb-4 tracking-wide">
        [Post-Verdict Confrontation]
      </h2>

      {/* Dialogue Bubbles */}
      <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
        {dialogue.map((line, idx) => (
          <DialogueBubble key={idx} line={line} />
        ))}
      </div>

      {/* Aftermath */}
      {aftermath && (
        <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">Aftermath:</h3>
          <p className="text-sm text-gray-300 italic leading-relaxed whitespace-pre-wrap">
            {aftermath}
          </p>
        </div>
      )}

      {/* Case Solved Banner */}
      <div
        className={`rounded p-4 text-center border ${
          caseSolvedCorrectly
            ? 'bg-green-900/30 border-green-700'
            : 'bg-yellow-900/30 border-yellow-700'
        }`}
      >
        <div
          className={`text-lg font-bold ${
            caseSolvedCorrectly ? 'text-green-400' : 'text-yellow-400'
          }`}
        >
          {caseSolvedCorrectly ? '* CASE SOLVED' : '* CASE RESOLVED'}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {caseSolvedCorrectly
            ? 'Justice has been served. Well done, Auror.'
            : 'The case has been resolved. Review the evidence for future cases.'}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded
                   transition-colors border border-gray-600"
      >
        Close Case File
      </button>
    </div>
  );
}
