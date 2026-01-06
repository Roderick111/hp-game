import { CaseData } from '../../types/game';
import { useGame } from '../../hooks/useGame';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Props {
  caseData: CaseData;
}

export function Resolution({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const { hypotheses, resolution } = caseData;

  const correctHypothesis = hypotheses.find(h => h.id === resolution.correctHypothesisId);
  const playerAssignedToCorrect = state.finalProbabilities[resolution.correctHypothesisId] || 0;
  const playerSelectedCorrect = state.selectedHypotheses.includes(resolution.correctHypothesisId);

  // Find the player's top pick
  const topPickId = Object.entries(state.finalProbabilities)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const topPick = hypotheses.find(h => h.id === topPickId);
  const topPickProbability = state.finalProbabilities[topPickId] || 0;
  const topPickWasCorrect = topPickId === resolution.correctHypothesisId;

  return (
    <div className="space-y-6">
      {/* Case Closed Header */}
      <Card variant="official">
        <div className="text-center">
          <div className="inline-block px-6 py-2 bg-amber-800 text-amber-100 text-lg font-bold uppercase tracking-wider mb-4 rounded">
            Case Closed
          </div>
          <h1 className="text-3xl font-serif font-bold text-amber-900">
            {caseData.title}
          </h1>
        </div>
      </Card>

      {/* The Truth */}
      <Card>
        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
          The Truth
        </h2>
        <p className="text-amber-800 leading-relaxed whitespace-pre-line">
          {resolution.truthSummary}
        </p>
      </Card>

      {/* Your Prediction vs Reality */}
      <Card variant={topPickWasCorrect ? 'success' : 'warning'}>
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">
          Your Predictions vs Reality
        </h2>

        <div className="space-y-4">
          {/* Player's top pick */}
          <div className={`p-4 rounded-lg ${topPickWasCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-lg">
                  Your Top Pick: {topPick?.label}
                </p>
                <p className="text-sm opacity-75">
                  You assigned {topPickProbability}% probability
                </p>
              </div>
              <div className={`text-3xl ${topPickWasCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {topPickWasCorrect ? '✓' : '✗'}
              </div>
            </div>
            <p className={`mt-2 font-medium ${topPickWasCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {topPickWasCorrect ? 'CORRECT!' : 'INCORRECT'}
            </p>
          </div>

          {/* Correct answer (if different from top pick) */}
          {!topPickWasCorrect && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-lg text-green-800">
                    Correct Answer: {correctHypothesis?.label}
                  </p>
                  <p className="text-sm text-green-700">
                    You assigned {playerAssignedToCorrect}% probability
                    {!playerSelectedCorrect && ' (you didn\'t select this hypothesis)'}
                  </p>
                </div>
                <div className="text-3xl text-green-600">✓</div>
              </div>
            </div>
          )}

          {/* All hypotheses breakdown */}
          <div className="mt-6">
            <h3 className="font-bold text-amber-900 mb-3">Full Breakdown:</h3>
            <div className="space-y-2">
              {state.selectedHypotheses.map(hypId => {
                const hypothesis = hypotheses.find(h => h.id === hypId);
                if (!hypothesis) return null;

                const prob = state.finalProbabilities[hypId] || 0;
                const isCorrect = hypId === resolution.correctHypothesisId;

                return (
                  <div
                    key={hypId}
                    className={`flex items-center justify-between p-3 rounded ${
                      isCorrect ? 'bg-green-100' : 'bg-amber-50'
                    }`}
                  >
                    <span className={isCorrect ? 'font-bold text-green-800' : 'text-amber-800'}>
                      {hypothesis.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{prob}%</span>
                      <span className={isCorrect ? 'text-green-600 font-bold' : 'text-red-600'}>
                        {isCorrect ? '✓ TRUE' : '✗ FALSE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Calibration Note */}
      <Card variant="speech">
        <div className="flex items-start gap-4">
          <span className="text-3xl">💡</span>
          <div>
            <p className="font-bold text-amber-900 mb-2">Calibration Note</p>
            {playerSelectedCorrect ? (
              playerAssignedToCorrect >= 50 ? (
                <p className="text-amber-800">
                  You assigned {playerAssignedToCorrect}% to the correct answer. Good job recognizing it was a strong possibility!
                </p>
              ) : (
                <p className="text-amber-800">
                  You assigned only {playerAssignedToCorrect}% to the correct answer. This happens! But notice: what evidence could you have found that would have raised this probability?
                </p>
              )
            ) : (
              <p className="text-amber-800">
                You didn't include the correct hypothesis in your selection. This is a good reminder to keep "something else" as an option—the true answer might not always be obvious from the initial briefing.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Why This Was Tricky */}
      <Card>
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">
          What Made This Case Tricky
        </h2>
        <p className="text-amber-800 leading-relaxed whitespace-pre-line">
          {resolution.explanationOfDifficulty}
        </p>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={() => dispatch({ type: 'ADVANCE_PHASE' })}
          size="lg"
        >
          Continue to Case Review →
        </Button>
      </div>
    </div>
  );
}
