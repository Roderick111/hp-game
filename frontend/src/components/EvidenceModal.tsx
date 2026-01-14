/**
 * EvidenceModal Component
 *
 * Modal displaying detailed evidence information with terminal UI aesthetic.
 * Shows evidence name, location found, and full description.
 *
 * @module components/EvidenceModal
 * @since Phase 2.5
 */

import { Modal } from './ui/Modal';
import type { EvidenceDetails } from '../types/investigation';

// ============================================
// Types
// ============================================

interface EvidenceModalProps {
  /** Evidence details to display (null to hide modal) */
  evidence: EvidenceDetails | null;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

// ============================================
// Component
// ============================================

export function EvidenceModal({
  evidence,
  onClose,
  loading = false,
  error = null,
}: EvidenceModalProps) {
  // Loading state
  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="EVIDENCE DETAILS" variant="terminal" maxWidth="max-w-2xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-green-400">
            Loading evidence details...
          </div>
        </div>
      </Modal>
    );
  }

  // Error state
  if (error) {
    return (
      <Modal isOpen={true} onClose={onClose} title="EVIDENCE DETAILS" variant="terminal" maxWidth="max-w-2xl">
        <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      </Modal>
    );
  }

  // No evidence selected
  if (!evidence) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="EVIDENCE DETAILS" variant="terminal" maxWidth="max-w-2xl">
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-white font-mono">[ NAME ]</span>
          <span className="ml-3 text-white">{evidence.name}</span>
        </div>

        <div>
          <span className="text-white font-mono">[ ORIGIN ]</span>
          <span className="ml-3 text-white">{evidence.location_found}</span>
        </div>

        <div className="pt-2">
          <p className="text-gray-400 leading-relaxed">
            {evidence.description}
          </p>
        </div>
      </div>
    </Modal>
  );
}
