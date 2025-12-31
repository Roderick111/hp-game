import { useState } from 'react';
import { CaseData, InvestigationAction } from '../../types/game';
import { useGame } from '../../hooks/useGame';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EvidenceCard } from '../ui/EvidenceCard';
import { Modal } from '../ui/Modal';

interface Props {
  caseData: CaseData;
}

export function Investigation({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const [activeEvidence, setActiveEvidence] = useState<InvestigationAction | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const { investigationActions } = caseData;
  const ip = state.investigationPointsRemaining;

  // Group actions by category
  const locations = investigationActions.filter(a => a.category === 'location');
  const witnesses = investigationActions.filter(a => a.category === 'witness');
  const records = investigationActions.filter(a => a.category === 'records');

  // Check if action is already collected
  const isCollected = (id: string) => state.collectedEvidenceIds.includes(id);

  // Handle collecting evidence
  const collectEvidence = (action: InvestigationAction) => {
    if (ip < action.cost || isCollected(action.id)) return;

    dispatch({
      type: 'COLLECT_EVIDENCE',
      actionId: action.id,
      cost: action.cost
    });
    setActiveEvidence(action);
    setShowEvidenceModal(true);
  };

  // Render action button
  const renderAction = (action: InvestigationAction) => {
    const collected = isCollected(action.id);
    const canAfford = ip >= action.cost;

    return (
      <div
        key={action.id}
        className={`
          p-4 rounded-lg border-2 transition-all duration-200
          ${collected
            ? 'bg-green-50 border-green-300 cursor-pointer hover:bg-green-100'
            : canAfford
            ? 'bg-amber-50 border-amber-200 cursor-pointer hover:border-amber-400 hover:shadow-md'
            : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
          }
        `}
        onClick={() => {
          if (collected) {
            setActiveEvidence(action);
            setShowEvidenceModal(true);
          } else if (canAfford) {
            collectEvidence(action);
          }
        }}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold ${collected ? 'text-green-800' : 'text-amber-900'}`}>
              {collected && <span className="mr-1">✓</span>}
              {action.title}
            </h4>
            <p className="text-sm text-amber-700 mt-1 line-clamp-2">{action.description}</p>
          </div>
          <span className={`
            px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap
            ${collected
              ? 'bg-green-100 text-green-700'
              : canAfford
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-500'
            }
          `}>
            {collected ? 'Done' : `${action.cost} IP`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* IP Counter */}
      <Card variant="official">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-amber-900">Investigation Phase</h2>
            <p className="text-amber-700 text-sm mt-1">
              Choose your investigation actions wisely. Each action costs Investigation Points.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-amber-900">
              {ip} <span className="text-lg font-normal">IP remaining</span>
            </div>
            <div className="flex gap-1.5 mt-2 justify-end">
              {Array.from({ length: caseData.briefing.investigationPoints }).map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full transition-colors duration-300 ${
                    i < ip ? 'bg-amber-500' : 'bg-amber-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Actions Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Locations */}
        <div>
          <h3 className="font-bold text-amber-900 mb-3 text-lg flex items-center gap-2">
            <span className="text-2xl">📍</span> Locations
          </h3>
          <div className="space-y-3">
            {locations.map(renderAction)}
          </div>
        </div>

        {/* Witnesses */}
        <div>
          <h3 className="font-bold text-amber-900 mb-3 text-lg flex items-center gap-2">
            <span className="text-2xl">👤</span> Witnesses
          </h3>
          <div className="space-y-3">
            {witnesses.map(renderAction)}
          </div>
        </div>

        {/* Records */}
        <div>
          <h3 className="font-bold text-amber-900 mb-3 text-lg flex items-center gap-2">
            <span className="text-2xl">📜</span> Records
          </h3>
          <div className="space-y-3">
            {records.map(renderAction)}
          </div>
        </div>
      </div>

      {/* Collected Evidence Summary */}
      {state.collectedEvidenceIds.length > 0 && (
        <Card>
          <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span className="text-xl">📋</span> Evidence Collected ({state.collectedEvidenceIds.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-2">
            {state.collectedEvidenceIds.map(id => {
              const action = investigationActions.find(a => a.id === id);
              if (!action) return null;
              return (
                <div
                  key={id}
                  className="p-3 bg-green-50 rounded border border-green-200 cursor-pointer hover:bg-green-100 transition-colors flex items-center gap-2"
                  onClick={() => {
                    setActiveEvidence(action);
                    setShowEvidenceModal(true);
                  }}
                >
                  <span className="text-green-600">✓</span>
                  <span className="text-green-800 text-sm font-medium">
                    {action.evidence.title}
                  </span>
                  {action.evidence.isCritical && (
                    <span className="text-red-500 text-xs">★</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Proceed Button */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-amber-200">
        <span className="text-amber-700 text-center md:text-left">
          {state.collectedEvidenceIds.length === 0
            ? 'Collect at least one piece of evidence to proceed'
            : ip > 0
            ? `You can still investigate (${ip} IP remaining)`
            : 'No investigation points remaining'
          }
        </span>
        <Button
          onClick={() => dispatch({ type: 'ADVANCE_PHASE' })}
          disabled={state.collectedEvidenceIds.length === 0}
          size="lg"
        >
          Lock In & Make Predictions →
        </Button>
      </div>

      {/* Evidence Modal */}
      <Modal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        title="Evidence Collected"
      >
        {activeEvidence && (
          <EvidenceCard evidence={activeEvidence.evidence} />
        )}
      </Modal>
    </div>
  );
}
