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
  if (speakerLower === "moody") return "text-blue-400";
  if (speakerLower === "player" || speakerLower === "you")
    return "text-blue-400";
  // Suspects/culprits
  return "text-yellow-400";
}

function getSpeakerBorder(speaker: string): string {
  const speakerLower = speaker.toLowerCase();
  if (speakerLower === "moody") return "border-blue-700";
  if (speakerLower === "player" || speakerLower === "you")
    return "border-blue-700";
  // Suspects/culprits
  return "border-yellow-700";
}

function formatSpeakerName(speaker: string): string {
  return speaker.toUpperCase();
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
        :: {formatSpeakerName(line.speaker)} ::
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
  return (
    <div className="font-mono">
      {/* Case Solved Banner */}
      <div
        className={`p-5 text-center border-2 mb-10 ${caseSolvedCorrectly
            ? "bg-gradient-to-br from-green-900/20 via-green-800/10 to-gray-900/20 border-green-600"
            : "bg-gray-900 border-gray-700"
          }`}
      >
        <div
          className={`text-xl font-bold tracking-widest uppercase mb-2 ${caseSolvedCorrectly ? "text-green-400" : "text-gray-300"
            }`}
        >
          {caseSolvedCorrectly ? "★ CASE SOLVED ★" : "* CASE RESOLVED *"}
        </div>
        <div
          className={`text-xs tracking-wide uppercase ${caseSolvedCorrectly ? "text-green-300/90" : "text-gray-500"
            }`}
        >
          {caseSolvedCorrectly
            ? "⚡ JUSTICE HAS BEEN SERVED. EXCELLENT WORK, AUROR! ⚡"
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
          <h3 className="text-xs font-bold text-gray-500 mb-3 tracking-widest uppercase text-center">
            :: Aftermath ::
          </h3>
          <p className="text-sm text-gray-400 italic leading-relaxed whitespace-pre-wrap text-center">
            {aftermath}
          </p>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full py-3 px-4 bg-gray-900 border border-gray-500 text-white font-mono text-sm uppercase tracking-widest
                   hover:bg-gray-800 hover:border-gray-300 transition-all duration-200
                   focus:outline-none focus:ring-1 focus:ring-gray-400"
      >
        {">> CLOSE CASE FILE_"}
      </button>
    </div>
  );
}
