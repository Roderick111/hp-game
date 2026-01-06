import { useEffect } from 'react';
import { CaseData } from '../../types/game';
import { useGame } from '../../hooks/useGame';
import { probabilitiesAreValid } from '../../utils/scoring';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProbabilitySlider } from '../ui/ProbabilitySlider';

interface Props {
  caseData: CaseData;
}

export function Prediction({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const { hypotheses } = caseData;

  // Initialize final probabilities from initial probabilities
  useEffect(() => {
    if (Object.keys(state.finalProbabilities).length === 0) {
      // Copy initial probabilities to final probabilities
      for (const [hypId, prob] of Object.entries(state.initialProbabilities)) {
        dispatch({ type: 'SET_FINAL_PROBABILITY', hypothesisId: hypId, value: prob });
      }
    }
  }, [state.initialProbabilities, state.finalProbabilities, dispatch]);

  const canProceed = probabilitiesAreValid(state.finalProbabilities);

  // Update probability
  const setProbability = (id: string, value: number) => {
    dispatch({ type: 'SET_FINAL_PROBABILITY', hypothesisId: id, value });
  };

  // Update confidence
  const setConfidence = (level: number) => {
    dispatch({ type: 'SET_CONFIDENCE', level });
  };

  // Calculate sum for display
  const probabilitySum = Object.values(state.finalProbabilities)
    .reduce((a, b) => a + b, 0);

  // Find the top hypothesis
  const topHypothesisId = Object.entries(state.finalProbabilities)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const topHypothesis = hypotheses.find(h => h.id === topHypothesisId);

  const confidenceLabels = [
    'Very Uncertain',
    'Somewhat Uncertain',
    'Moderately Confident',
    'Fairly Confident',
    'Very Confident'
  ];

  return (
    <div className="space-y-6">
      <Card variant="official">
        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">
          Prediction Lock-In
        </h2>
        <p className="text-amber-800">
          Based on your investigation, update your probability estimates for each hypothesis.
          Once you lock in your predictions, you cannot change them.
        </p>
      </Card>

      {/* Hypothesis Probability Updates */}
      <div className="space-y-4">
        <h3 className="font-bold text-amber-900 text-lg">
          What do you think happened?
        </h3>

        {state.selectedHypotheses.map(hypId => {
          const hypothesis = hypotheses.find(h => h.id === hypId);
          if (!hypothesis) return null;

          const initialProb = state.initialProbabilities[hypId] || 0;
          const finalProb = state.finalProbabilities[hypId] || 0;
          const change = finalProb - initialProb;

          return (
            <Card
              key={hypId}
              variant={hypId === topHypothesisId ? 'selected' : 'default'}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h4 className="font-bold text-amber-900">{hypothesis.label}</h4>
                  <p className="text-amber-700 text-sm">{hypothesis.description}</p>
                </div>
                {change !== 0 && (
                  <span className={`
                    text-sm font-medium px-2 py-1 rounded
                    ${change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                  `}>
                    {change > 0 ? '+' : ''}{change}% from initial
                  </span>
                )}
              </div>
              <ProbabilitySlider
                value={finalProb}
                onChange={(v) => setProbability(hypId, v)}
              />
            </Card>
          );
        })}
      </div>

      {/* Probability Sum Indicator */}
      <Card variant={probabilitySum === 100 ? 'success' : 'warning'}>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-medium text-amber-900">Total Probability:</span>
            {probabilitySum !== 100 && (
              <span className="text-amber-700 text-sm ml-2">
                (must equal 100%)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${
              probabilitySum === 100 ? 'text-green-600' : 'text-amber-600'
            }`}>
              {probabilitySum}%
            </span>
            {probabilitySum === 100 && (
              <span className="text-green-600 text-xl">✓</span>
            )}
          </div>
        </div>
      </Card>

      {/* Confidence Level */}
      {topHypothesis && (
        <Card>
          <h3 className="font-bold text-amber-900 mb-4">
            How confident are you in your top pick?
          </h3>
          <div className="bg-amber-50 p-4 rounded-lg mb-4">
            <p className="text-amber-800">
              Your leading theory: <strong>{topHypothesis.label}</strong> at <strong>{state.finalProbabilities[topHypothesisId] || 0}%</strong>
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="range"
              min="1"
              max="5"
              value={state.confidenceLevel}
              onChange={(e) => setConfidence(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-amber-200 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-6
                       [&::-webkit-slider-thumb]:h-6
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-amber-600
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-md"
            />
            <div className="flex justify-between text-sm text-amber-700">
              <span>Very Uncertain</span>
              <span>Very Confident</span>
            </div>
            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-amber-100 rounded-lg font-medium text-amber-900">
                {confidenceLabels[state.confidenceLevel - 1]}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Warning Message */}
      <Card variant="warning">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-900 mb-1">Final Decision</p>
            <p className="text-amber-800 text-sm">
              Once you lock in your predictions, you cannot change them. The truth will be revealed, and your predictions will be compared against reality.
            </p>
          </div>
        </div>
      </Card>

      {/* Proceed Button */}
      <div className="flex justify-between items-center pt-4 border-t border-amber-200">
        <span className="text-amber-700">
          {!canProceed
            ? `Adjust probabilities to sum to 100% (currently ${probabilitySum}%)`
            : '✓ Ready to reveal the truth'
          }
        </span>
        <Button
          onClick={() => {
            dispatch({ type: 'CALCULATE_SCORES', caseData });
            dispatch({ type: 'ADVANCE_PHASE' });
          }}
          disabled={!canProceed}
          size="lg"
        >
          Lock In & Reveal Truth →
        </Button>
      </div>
    </div>
  );
}
