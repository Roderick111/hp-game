/**
 * WitnessSelector Component
 *
 * Lists available witnesses with:
 * - ASCII trust level indicator per witness
 * - Click to select for interrogation
 * - Visual indicator for secrets revealed count
 *
 * @module components/WitnessSelector
 * @since Phase 2
 */

import { Card } from './ui/Card';
import type { WitnessInfo } from '../types/investigation';

// ============================================
// Types
// ============================================

interface WitnessSelectorProps {
  /** List of available witnesses */
  witnesses: WitnessInfo[];
  /** Currently selected witness ID (if any) */
  selectedWitnessId?: string;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Callback when witness is selected */
  onSelectWitness: (witnessId: string) => void;
}

// ============================================
// Helpers
// ============================================

/**
 * Generate ASCII trust bar using block characters
 * @param trust - Trust percentage (0-100)
 * @returns 10-character ASCII bar (e.g., "████░░░░░░")
 */
function generateAsciiTrustBar(trust: number): string {
  const filledBlocks = Math.floor(trust / 10);
  const emptyBlocks = 10 - filledBlocks;
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}

// ============================================
// Sub-components
// ============================================

interface WitnessCardProps {
  witness: WitnessInfo;
  isSelected: boolean;
  onClick: () => void;
}

function WitnessCard({ witness, isSelected, onClick }: WitnessCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200
        ${isSelected
          ? 'bg-gray-800 border-gray-500'
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`Select ${witness.name} for interrogation. Trust: ${witness.trust}%. Secrets revealed: ${witness.secrets_revealed.length}`}
    >
      {/* Witness name with bullet */}
      <div className="flex items-baseline gap-2">
        <span className="text-gray-400">•</span>
        <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>
          {witness.name}
        </span>
      </div>

      {/* Trust bar */}
      <div className="ml-4 mt-1 text-sm text-gray-400 font-mono">
        Trust: {generateAsciiTrustBar(witness.trust)} {witness.trust}%
      </div>

      {/* Secrets count */}
      {witness.secrets_revealed.length > 0 && (
        <div className="ml-4 text-sm text-gray-400">
          {witness.secrets_revealed.length} secret{witness.secrets_revealed.length !== 1 ? 's' : ''}
        </div>
      )}
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export function WitnessSelector({
  witnesses,
  selectedWitnessId,
  loading,
  error,
  onSelectWitness,
}: WitnessSelectorProps) {
  // Loading state
  if (loading && witnesses.length === 0) {
    return (
      <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading witnesses...</div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error && witnesses.length === 0) {
    return (
      <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
        <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      </Card>
    );
  }

  // Empty state
  if (witnesses.length === 0) {
    return (
      <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
        <p className="text-gray-500 text-sm italic text-center py-4">
          No witnesses available for this case.
        </p>
      </Card>
    );
  }

  return (
    <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white uppercase tracking-wide">
          AVAILABLE WITNESSES
        </h3>
        <div className="text-gray-600 mt-1">────────────────────────────────</div>
      </div>

      {/* Witness List */}
      <div className="space-y-2">
        {witnesses.map((witness) => (
          <WitnessCard
            key={witness.id}
            witness={witness}
            isSelected={witness.id === selectedWitnessId}
            onClick={() => onSelectWitness(witness.id)}
          />
        ))}
      </div>
    </Card>
  );
}
