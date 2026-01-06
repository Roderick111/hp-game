/**
 * WitnessSelector Component
 *
 * Lists available witnesses with:
 * - Trust level indicator per witness
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
// Sub-components
// ============================================

interface WitnessCardProps {
  witness: WitnessInfo;
  isSelected: boolean;
  onClick: () => void;
}

function WitnessCard({ witness, isSelected, onClick }: WitnessCardProps) {
  // Trust color
  const getTrustColor = (trust: number): string => {
    if (trust < 30) return 'text-red-400';
    if (trust < 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getTrustBgColor = (trust: number): string => {
    if (trust < 30) return 'bg-red-500';
    if (trust < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200
        ${isSelected
          ? 'bg-amber-900/30 border-amber-600'
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`Select ${witness.name} for interrogation. Trust: ${witness.trust}%. Secrets revealed: ${witness.secrets_revealed.length}`}
    >
      <div className="flex items-center justify-between">
        {/* Witness name and selection indicator */}
        <div className="flex items-center gap-2">
          {isSelected && (
            <span className="text-amber-400 text-sm">{'>'}</span>
          )}
          <span className={`font-medium ${isSelected ? 'text-amber-300' : 'text-gray-200'}`}>
            {witness.name}
          </span>
        </div>

        {/* Trust indicator */}
        <div className="flex items-center gap-3">
          {/* Secrets badge */}
          {witness.secrets_revealed.length > 0 && (
            <span
              className="px-2 py-0.5 text-xs bg-purple-900/50 text-purple-300 border border-purple-600/50 rounded"
              title={`${witness.secrets_revealed.length} secret(s) revealed`}
            >
              {witness.secrets_revealed.length} secret{witness.secrets_revealed.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* Trust level */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getTrustBgColor(witness.trust)}`}
                style={{ width: `${witness.trust}%` }}
              />
            </div>
            <span className={`text-xs font-mono ${getTrustColor(witness.trust)}`}>
              {witness.trust}%
            </span>
          </div>
        </div>
      </div>
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
      <div className="border-b border-gray-700 pb-3 mb-4">
        <h2 className="text-lg font-bold text-amber-400 tracking-wide">
          Available Witnesses
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Select a witness to begin interrogation
        </p>
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

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Trust:{' '}
          <span className="text-red-400">Low (&lt;30)</span>{' '}
          <span className="text-yellow-400">Medium (30-70)</span>{' '}
          <span className="text-green-400">High (&gt;70)</span>
        </p>
      </div>
    </Card>
  );
}
