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
import { TERMINAL_THEME } from '../styles/terminal-theme';
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
          <div className={`animate-pulse ${TERMINAL_THEME.colors.state.success.text}`}>
            Loading evidence details...
          </div>
        </div>
      </Modal>
    );
  }

  // Error state
  if (error) {
    const errorTheme = TERMINAL_THEME.colors.state.error;
    return (
      <Modal isOpen={true} onClose={onClose} title="EVIDENCE DETAILS" variant="terminal" maxWidth="max-w-2xl">
        <div className={`p-4 ${errorTheme.bg} border ${errorTheme.border} rounded-sm ${errorTheme.text} text-sm`}>
          <span className="font-bold">{TERMINAL_THEME.messages.error('')}</span> {error}
        </div>
      </Modal>
    );
  }

  // No evidence selected
  if (!evidence) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="EVIDENCE DETAILS" variant="terminal" maxWidth="max-w-2xl">
      <div className="space-y-4 text-sm font-mono">
        {/* Name field */}
        <div className="border-l border-gray-600 pl-3 py-1">
          <span className={TERMINAL_THEME.typography.caption}>
            [ NAME ]
          </span>
          <p className={`${TERMINAL_THEME.colors.text.primary} mt-1`}>
            {evidence.name}
          </p>
        </div>

        {/* Separator */}
        <div className={TERMINAL_THEME.colors.text.separator}>
          {TERMINAL_THEME.symbols.separatorShort}
        </div>

        {/* Origin field */}
        <div className="border-l border-gray-600 pl-3 py-1">
          <span className={TERMINAL_THEME.typography.caption}>
            [ ORIGIN ]
          </span>
          <p className={`${TERMINAL_THEME.colors.text.primary} mt-1`}>
            {evidence.location_found}
          </p>
        </div>

        {/* Separator */}
        <div className={TERMINAL_THEME.colors.text.separator}>
          {TERMINAL_THEME.symbols.separatorShort}
        </div>

        {/* Description */}
        <div className="pt-2">
          <span className={`${TERMINAL_THEME.typography.caption} block mb-2`}>
            [ DESCRIPTION ]
          </span>
          <p className={`${TERMINAL_THEME.colors.text.tertiary} leading-relaxed`}>
            {evidence.description}
          </p>
        </div>
      </div>
    </Modal>
  );
}
