import { CaseData } from '../../types/game';
import { useGame } from '../../hooks/useGame';
import { getConfirmationBiasInterpretation } from '../../utils/scoring';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Props {
  caseData: CaseData;
}

export function CaseReview({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const { biasLessons } = caseData;
  const scores = state.scores;

  if (!scores) {
    return (
      <Card>
        <p className="text-amber-800">Loading review data...</p>
      </Card>
    );
  }

  const biasInterpretation = getConfirmationBiasInterpretation(scores.confirmationBiasScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="official">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-amber-900">
            Case Review
          </h1>
          <p className="text-amber-700 mt-2">
            Learning from your investigation
          </p>
        </div>
      </Card>

      {/* Investigation Pattern Analysis */}
      <Card>
        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
          Your Investigation Pattern
        </h2>

        <div className="space-y-4">
          <p className="text-amber-800">
            Investigation Points spent by hypothesis relevance:
          </p>

          {/* Visualization */}
          <div className="space-y-3">
            {scores.investigationBreakdown.map(item => (
              <div key={item.hypothesisId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-900 font-medium">{item.hypothesisLabel}</span>
                  <span className="text-amber-700">{item.percentage}%</span>
                </div>
                <div className="h-4 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.hypothesisId === scores.investigationBreakdown[0]?.hypothesisId
                        ? 'bg-amber-600'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Confirmation Bias Assessment */}
          <div className={`p-4 rounded-lg mt-6 ${
            biasInterpretation.level === 'low'
              ? 'bg-green-50 border border-green-200'
              : biasInterpretation.level === 'medium'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                {biasInterpretation.level === 'low' ? '✓' : '⚠️'}
              </span>
              <div>
                <p className={`font-bold mb-1 ${
                  biasInterpretation.level === 'low'
                    ? 'text-green-800'
                    : biasInterpretation.level === 'medium'
                    ? 'text-amber-800'
                    : 'text-red-800'
                }`}>
                  {biasInterpretation.level === 'low'
                    ? 'WELL-DIVERSIFIED INVESTIGATION'
                    : biasInterpretation.level === 'medium'
                    ? 'MODERATE FOCUS DETECTED'
                    : 'CONFIRMATION BIAS DETECTED'}
                </p>
                <p className="text-sm">
                  {biasInterpretation.message}
                </p>
              </div>
            </div>
          </div>

          {/* Critical Evidence Check */}
          <div className={`p-4 rounded-lg ${
            scores.foundCriticalEvidence
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                {scores.foundCriticalEvidence ? '✓' : '✗'}
              </span>
              <div>
                <p className={`font-bold mb-1 ${
                  scores.foundCriticalEvidence ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scores.foundCriticalEvidence
                    ? 'FOUND ALL CRITICAL EVIDENCE'
                    : 'MISSED CRITICAL EVIDENCE'}
                </p>
                {!scores.foundCriticalEvidence && scores.missedCriticalEvidence.length > 0 && (
                  <p className="text-sm text-red-700">
                    You missed: {scores.missedCriticalEvidence.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bias Lessons */}
      <Card>
        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
          Biases in This Case
        </h2>

        <div className="space-y-6">
          {biasLessons.map((lesson, index) => (
            <div key={index} className="border-b border-amber-200 pb-6 last:border-0 last:pb-0">
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                {index + 1}. {lesson.biasName}
              </h3>
              <p className="text-amber-800 mb-3">{lesson.explanation}</p>
              <div className="bg-amber-50 p-3 rounded mb-3">
                <p className="text-amber-700 text-sm">
                  <strong>In this case:</strong> {lesson.howItApplied}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Counter-Technique */}
      <Card variant="selected">
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-4">
          The Counter-Technique: "What Would Distinguish?"
        </h2>
        <p className="text-amber-800 leading-relaxed">
          Before investigating any single lead, ask: <strong>"What evidence would tell me whether Hypothesis A or Hypothesis B is true?"</strong>
        </p>
        <p className="text-amber-800 leading-relaxed mt-3">
          In this case, that question leads directly to mechanism. If someone in the room cast the curse, there'd be wand residue. If the curse was on an object, the object would show magical traces. This discriminating evidence was available for just 2 IP (examine the violin)—but only if you thought to look.
        </p>
      </Card>

      {/* Real-World Application */}
      <Card>
        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2">
          Real-World Application
        </h2>

        <p className="text-amber-800 mb-4">
          The "obvious suspect" trap applies everywhere:
        </p>

        <div className="space-y-4">
          {biasLessons.map((lesson, index) => (
            <div key={index} className="bg-amber-50 p-4 rounded">
              <h4 className="font-bold text-amber-900 mb-2">{lesson.biasName}</h4>
              <p className="text-amber-700 text-sm">{lesson.realWorldExample}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Practice Prompt */}
      <Card variant="speech">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🎯</span>
          <div>
            <h3 className="font-bold text-amber-900 mb-2">Your Practice Prompt</h3>
            <p className="text-amber-800">
              Think of a recent situation where you were confident about someone's motives or the cause of a problem.
            </p>
            <p className="text-amber-800 mt-2">
              Ask yourself: <em>"What's an alternative explanation I haven't seriously considered? What evidence would distinguish between my current theory and this alternative?"</em>
            </p>
          </div>
        </div>
      </Card>

      {/* Play Again */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={() => dispatch({ type: 'RESET_GAME' })}
          size="lg"
          variant="primary"
        >
          Play Again
        </Button>
      </div>

      {/* Final Message */}
      <Card variant="official">
        <div className="text-center py-4">
          <p className="text-amber-800 font-serif text-lg">
            "The best Aurors I know? They look for evidence that would prove them wrong."
          </p>
          <p className="text-amber-700 mt-2">— Senior Auror G. Moody</p>
        </div>
      </Card>
    </div>
  );
}
