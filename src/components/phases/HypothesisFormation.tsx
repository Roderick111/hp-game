import { CaseData } from '../../types/game';
import { useGame } from '../../hooks/useGame';
import { probabilitiesAreValid } from '../../utils/scoring';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProbabilitySlider } from '../ui/ProbabilitySlider';

interface Props {
  caseData: CaseData;
}

export function HypothesisFormation({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const { hypotheses } = caseData;

  const selectedCount = state.selectedHypotheses.length;
  const canProceed = selectedCount >= 3 &&
    probabilitiesAreValid(state.initialProbabilities);

  // Toggle hypothesis selection
  const toggleHypothesis = (id: string) => {
    if (state.selectedHypotheses.includes(id)) {
      dispatch({ type: 'DESELECT_HYPOTHESIS', hypothesisId: id });
    } else {
      dispatch({ type: 'SELECT_HYPOTHESIS', hypothesisId: id });
    }
  };

  // Update probability
  const setProbability = (id: string, value: number) => {
    dispatch({ type: 'SET_INITIAL_PROBABILITY', hypothesisId: id, value });
  };

  // Calculate sum for display
  const probabilitySum = Object.values(state.initialProbabilities)
    .reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">
          Hypothesis Formation
        </h2>
        <p className="text-amber-800 mb-4">
          Before investigating, consider all the possibilities. Select <strong>at least 3 hypotheses</strong> you want to track, then assign probability estimates that sum to 100%.
        </p>
        <div className="bg-amber-100 p-3 rounded border border-amber-300">
          <p className="text-amber-700 text-sm">
            <strong>Tip:</strong> Always leave some probability for "something else" — the true answer might not be on your list. This is called epistemic humility.
          </p>
        </div>
      </Card>

      {/* Hypothesis Selection */}
      <div className="space-y-3">
        {hypotheses.map(hypothesis => {
          const isSelected = state.selectedHypotheses.includes(hypothesis.id);
          const probability = state.initialProbabilities[hypothesis.id] || 0;

          return (
            <Card
              key={hypothesis.id}
              variant={isSelected ? 'selected' : 'default'}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? '' : 'hover:border-amber-400'
              }`}
              onClick={() => toggleHypothesis(hypothesis.id)}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox indicator */}
                <div className={`
                  w-6 h-6 rounded border-2 flex items-center justify-center mt-1 flex-shrink-0
                  transition-colors duration-200
                  ${isSelected
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'border-amber-400 bg-white'
                  }
                `}>
                  {isSelected && '✓'}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-amber-900 text-lg">{hypothesis.label}</h3>
                  <p className="text-amber-700 text-sm mt-1">{hypothesis.description}</p>

                  {/* Probability slider (only if selected) */}
                  {isSelected && (
                    <div
                      className="mt-4 p-3 bg-amber-50 rounded border border-amber-200"
                      onClick={e => e.stopPropagation()}
                    >
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Initial Probability Estimate
                      </label>
                      <ProbabilitySlider
                        value={probability}
                        onChange={(v) => setProbability(hypothesis.id, v)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Probability Sum Indicator */}
      {selectedCount > 0 && (
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
          {probabilitySum !== 100 && (
            <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  probabilitySum > 100 ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(probabilitySum, 100)}%` }}
              />
            </div>
          )}
        </Card>
      )}

      {/* Proceed Button */}
      <div className="flex justify-between items-center pt-4 border-t border-amber-200">
        <span className="text-amber-700">
          {selectedCount < 3
            ? `Select at least ${3 - selectedCount} more hypothesis${3 - selectedCount === 1 ? '' : 'es'}`
            : probabilitySum !== 100
            ? `Adjust probabilities to sum to 100% (currently ${probabilitySum}%)`
            : '✓ Ready to begin investigation'
          }
        </span>
        <Button
          onClick={() => dispatch({ type: 'ADVANCE_PHASE' })}
          disabled={!canProceed}
          size="lg"
        >
          Begin Investigation →
        </Button>
      </div>
    </div>
  );
}
