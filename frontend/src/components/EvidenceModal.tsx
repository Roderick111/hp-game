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
      <Modal isOpen={true} onClose={onClose} title="EVIDENCE DETAILS">
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
      <Modal isOpen={true} onClose={onClose} title="EVIDENCE DETAILS">
        <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-gray-300"
        >
          Close
        </button>
      </Modal>
    );
  }

  // No evidence selected
  if (!evidence) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="EVIDENCE DETAILS">
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-500">Name:</span>
          <span className="ml-2 text-gray-200">{evidence.name}</span>
        </div>

        <div>
          <span className="text-gray-500">Location:</span>
          <span className="ml-2 text-gray-200">{evidence.location_found}</span>
        </div>

        <div>
          <span className="text-gray-500">Description:</span>
          <p className="mt-1 text-gray-300 leading-relaxed">
            {evidence.description}
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-6 px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-gray-300"
      >
        Close
      </button>
    </Modal>
  );
}
