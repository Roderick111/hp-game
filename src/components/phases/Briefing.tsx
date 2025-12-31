import { CaseData } from '../../types/game';
import { useGame } from '../../hooks/useGame';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Props {
  caseData: CaseData;
}

export function Briefing({ caseData }: Props) {
  const { dispatch } = useGame();
  const { briefing } = caseData;

  const handleStart = () => {
    dispatch({ type: 'START_GAME', investigationPoints: briefing.investigationPoints });
    dispatch({ type: 'ADVANCE_PHASE' });
  };

  return (
    <div className="space-y-6">
      {/* Case File Header */}
      <Card variant="official">
        <div className="text-center border-b-2 border-amber-700/30 pb-4 mb-4">
          <div className="inline-block px-4 py-1 bg-red-800 text-red-100 text-xs font-bold uppercase tracking-wider mb-2 rounded">
            Classified
          </div>
          <h1 className="text-2xl font-serif font-bold text-amber-900">
            Ministry of Magic - Auror Department
          </h1>
          <p className="text-amber-700 font-medium">Incident Report #{caseData.id}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-amber-100/50 p-4 rounded">
          <div><span className="font-bold text-amber-800">Date:</span> <span className="text-amber-900">{briefing.date}</span></div>
          <div><span className="font-bold text-amber-800">Location:</span> <span className="text-amber-900">{briefing.location}</span></div>
          <div><span className="font-bold text-amber-800">Victim:</span> <span className="text-amber-900">{briefing.victim}</span></div>
          <div><span className="font-bold text-amber-800">Status:</span> <span className="text-red-700 font-medium">{briefing.status}</span></div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="font-bold text-amber-900 mb-2 text-lg border-b border-amber-300 pb-1">
              Summary of Incident
            </h2>
            <p className="text-amber-800 leading-relaxed">{briefing.summary}</p>
          </section>

          <section>
            <h2 className="font-bold text-amber-900 mb-2 text-lg border-b border-amber-300 pb-1">
              Healer's Preliminary Report
            </h2>
            <p className="text-amber-800 italic bg-amber-50 p-3 rounded border-l-4 border-amber-400">
              "{briefing.healerReport}"
            </p>
          </section>

          <section>
            <h2 className="font-bold text-amber-900 mb-2 text-lg border-b border-amber-300 pb-1">
              Initial Witness Statement
            </h2>
            <p className="text-amber-700 font-semibold mb-1">{briefing.initialWitness.name}:</p>
            <p className="text-amber-800 italic bg-amber-50 p-3 rounded border-l-4 border-amber-400">
              "{briefing.initialWitness.statement}"
            </p>
          </section>

          <section>
            <h2 className="font-bold text-amber-900 mb-2 text-lg border-b border-amber-300 pb-1">
              Persons of Interest
            </h2>
            <ul className="space-y-3">
              {briefing.personsOfInterest.map((person, index) => (
                <li key={person.id} className="bg-amber-50 p-3 rounded border border-amber-200">
                  <span className="font-bold text-amber-900">{index + 1}. {person.name}</span>
                  <span className="text-amber-700"> — {person.description}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-amber-100 p-4 rounded-lg border border-amber-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📋</span>
              <span className="font-bold text-amber-900">Investigation Budget:</span>
              <span className="text-xl font-bold text-amber-700">{briefing.investigationPoints} Investigation Points</span>
            </div>
          </section>
        </div>
      </Card>

      {/* Mentor Introduction */}
      <Card variant="speech">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🧙</div>
          <div>
            <p className="text-amber-800 leading-relaxed whitespace-pre-line">
              {briefing.mentorIntro}
            </p>
            <p className="text-right text-amber-700 font-semibold mt-4">— Senior Auror G. Moody</p>
          </div>
        </div>
      </Card>

      {/* Proceed Button */}
      <div className="flex justify-end">
        <Button onClick={handleStart} size="lg">
          Begin Investigation →
        </Button>
      </div>
    </div>
  );
}
