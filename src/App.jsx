import React, { useState } from 'react';
import { courses, players as initialPlayers } from './data/courses';
import HoleView from './components/HoleView';
import ScoreCard from './components/ScoreCard';

function App() {
  const [currentCourse, setCurrentCourse] = useState(courses[0]);
  const [currentHoleNum, setCurrentHoleNum] = useState(1);
  const [scores, setScores] = useState({}); // { playerId: { holeNum: score } }
  const [view, setView] = useState('hole'); // 'hole', 'scorecard', 'results'
  const [winner, setWinner] = useState(null);

  const currentHole = currentCourse.holes.find(h => h.number === currentHoleNum);

  const handleScoreUpdate = (playerId, score) => {
    setScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [currentHoleNum]: score
      }
    }));
  };

  const handleNextHole = () => {
    if (currentHoleNum < 18) {
      setCurrentHoleNum(prev => prev + 1);
    } else {
      calculateWinner();
      setView('results');
    }
  };

  const handlePrevHole = () => {
    if (currentHoleNum > 1) {
      setCurrentHoleNum(prev => prev - 1);
    }
  };

  const calculateWinner = () => {
    // Simple gross score calculation
    let minScore = Infinity;
    let currentWinner = null;

    initialPlayers.forEach(p => {
      const playerTotal = Object.values(scores[p.id] || {}).reduce((a, b) => a + b, 0);
      // Simple net score (Total - Handicap/18 * holes played approx? Or just Total - Handicap)
      // Let's do Gross for now as requested "decir quien ganó" - typically Gross or Net.
      // With handicap provided: Net Score = Gross - Handicap
      const netScore = playerTotal - p.handicap;

      if (netScore < minScore) {
        minScore = netScore;
        currentWinner = p;
      }
    });
    setWinner(currentWinner);
  };

  return (
    <div className="min-h-screen bg-golf-light font-sans text-gray-800">
      <nav className="bg-golf-deep text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">Golf Caddy AI</h1>
          <div className="space-x-4 text-sm font-medium">
            <button onClick={() => setView('hole')} className={`hover:text-golf-accent transition ${view === 'hole' ? 'text-golf-accent' : 'opacity-80'}`}>Play</button>
            <button onClick={() => setView('scorecard')} className={`hover:text-golf-accent transition ${view === 'scorecard' ? 'text-golf-accent' : 'opacity-80'}`}>Scorecard</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4">
        {view === 'hole' && (
          <HoleView
            hole={currentHole}
            players={initialPlayers}
            scores={scores}
            onNextHole={handleNextHole}
            onPrevHole={handlePrevHole}
            onUpdateScore={handleScoreUpdate}
          />
        )}

        {view === 'scorecard' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-golf-deep text-center">{currentCourse.name}</h2>
            <ScoreCard
              players={initialPlayers}
              holes={currentCourse.holes}
              scores={scores}
              currentHole={currentHoleNum}
            />
          </div>
        )}

        {view === 'results' && winner && (
          <div className="text-center py-10 animate-fade-in-up">
            <div className="inline-block p-8 bg-white rounded-2xl shadow-2xl border-4 border-elegant-gold">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-4xl font-bold text-golf-deep mb-2">Winner!</h2>
              <p className="text-2xl text-gray-700 mb-6">{winner.name}</p>
              <div className="text-sm text-gray-500 uppercase tracking-widest">Based on Net Score</div>
              <button onClick={() => setView('scorecard')} className="mt-8 text-golf-deep underline font-bold">View Full Scorecard</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
