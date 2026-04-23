/**
 * WitnessesModal Component
 *
 * Modal wrapping WitnessSelector for sidebar-triggered display.
 * Uses shared Modal component for consistent design with Spell Book.
 *
 * @module components/WitnessesModal
 */

import { Modal } from './ui/Modal';
import { WitnessSelector } from './WitnessSelector';
import type { WitnessInfo } from '../types/investigation';

// ============================================
// Types
// ============================================

interface WitnessesModalProps {
  isOpen: boolean;
  onClose: () => void;
  witnesses: WitnessInfo[];
  loading: boolean;
  error: string | null;
  onSelectWitness: (id: string) => void;
}

// ============================================
// Component
// ============================================

export function WitnessesModal({
  isOpen,
  onClose,
  witnesses,
  loading,
  error,
  onSelectWitness,
}: WitnessesModalProps) {
  const handleSelectWitness = (id: string) => {
    onSelectWitness(id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WITNESSES"
      variant="terminal"
      maxWidth="max-w-md"
    >
      <WitnessSelector
        witnesses={witnesses}
        loading={loading}
        error={error}
        onSelectWitness={handleSelectWitness}
        collapsible={false}
        compact={false}
        bare={true}
      />
    </Modal>
  );
}
