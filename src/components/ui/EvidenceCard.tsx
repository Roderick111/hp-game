import { EvidenceData } from '../../types/game';

interface EvidenceCardProps {
  evidence: EvidenceData;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  return (
    <div className="space-y-4">
      <div className="border-b-2 border-amber-700 pb-2">
        <h3 className="text-xl font-serif font-bold text-amber-900">
          {evidence.isCritical && <span className="text-red-600">* </span>}
          {evidence.title}
        </h3>
      </div>

      <div className="bg-parchment-100 p-4 rounded border border-amber-200">
        <h4 className="font-bold text-amber-800 mb-2 text-sm uppercase tracking-wide">
          Findings
        </h4>
        <div className="text-amber-900 whitespace-pre-line leading-relaxed">
          {evidence.content}
        </div>
      </div>

      <div className="bg-amber-100 p-4 rounded border border-amber-300">
        <h4 className="font-bold text-amber-800 mb-2 text-sm uppercase tracking-wide">
          Interpretation
        </h4>
        <p className="text-amber-900 italic">
          {evidence.interpretation}
        </p>
      </div>

      {evidence.isCritical && (
        <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
          <span className="text-red-700 font-semibold text-sm">
            CRITICAL EVIDENCE
          </span>
        </div>
      )}
    </div>
  );
}
