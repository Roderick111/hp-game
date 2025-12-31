import { GameProvider } from './context/GameContext';
import { GameShell } from './components/layout/GameShell';
import { useGame } from './hooks/useGame';
import { mission1 } from './data/mission1';

// Phase components
import { Briefing } from './components/phases/Briefing';
import { HypothesisFormation } from './components/phases/HypothesisFormation';
import { Investigation } from './components/phases/Investigation';
import { Prediction } from './components/phases/Prediction';
import { Resolution } from './components/phases/Resolution';
import { CaseReview } from './components/phases/CaseReview';

function GameContent() {
  const { state } = useGame();

  // Simple phase-based rendering (no router needed)
  const renderPhase = () => {
    switch (state.currentPhase) {
      case 'briefing':
        return <Briefing caseData={mission1} />;
      case 'hypothesis':
        return <HypothesisFormation caseData={mission1} />;
      case 'investigation':
        return <Investigation caseData={mission1} />;
      case 'prediction':
        return <Prediction caseData={mission1} />;
      case 'resolution':
        return <Resolution caseData={mission1} />;
      case 'review':
        return <CaseReview caseData={mission1} />;
      default:
        return <Briefing caseData={mission1} />;
    }
  };

  return (
    <GameShell caseTitle={mission1.title} currentPhase={state.currentPhase}>
      {renderPhase()}
    </GameShell>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
