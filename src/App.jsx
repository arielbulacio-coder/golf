import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { courses, players as initialPlayers } from './data/courses';
import HoleView from './components/HoleView';
import ScoreCard from './components/ScoreCard';
import CalibrationView from './components/CalibrationView';

function App() {
  const { t, i18n } = useTranslation();
  const [currentCourse, setCurrentCourse] = useState(courses[0]);
  const [currentHoleNum, setCurrentHoleNum] = useState(1);
  const [scores, setScores] = useState({}); // { playerId: { holeNum: score } }
  const [view, setView] = useState('hole'); // 'hole', 'scorecard', 'results', 'credits'
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
    let minScore = Infinity;
    let currentWinner = null;

    initialPlayers.forEach(p => {
      const playerTotal = Object.values(scores[p.id] || {}).reduce((a, b) => a + b, 0);
      const netScore = playerTotal - p.handicap;

      if (netScore < minScore) {
        minScore = netScore;
        currentWinner = p;
      }
    });
    setWinner(currentWinner);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-golf-light font-sans text-gray-800 flex flex-col">
      <nav className="bg-golf-deep text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">{t('appTitle')}</h1>
            <div className="flex space-x-2">
              <button onClick={() => changeLanguage('es')} className={`text-xl hover:scale-110 transition ${i18n.language === 'es' ? 'opacity-100' : 'opacity-50'}`}>🇪🇸</button>
              <button onClick={() => changeLanguage('en')} className={`text-xl hover:scale-110 transition ${i18n.language === 'en' ? 'opacity-100' : 'opacity-50'}`}>🇺🇸</button>
              <button onClick={() => changeLanguage('zh')} className={`text-xl hover:scale-110 transition ${i18n.language === 'zh' ? 'opacity-100' : 'opacity-50'}`}>🇨🇳</button>
            </div>
          </div>
          <div className="space-x-4 text-sm font-medium">
            <button onClick={() => setView('hole')} className={`hover:text-golf-accent transition ${view === 'hole' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.play')}</button>
            <button onClick={() => setView('scorecard')} className={`hover:text-golf-accent transition ${view === 'scorecard' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.scorecard')}</button>
            <button onClick={() => setView('credits')} className={`hover:text-golf-accent transition ${view === 'credits' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.credits')}</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 flex-grow w-full">
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
              <h2 className="text-4xl font-bold text-golf-deep mb-2">{t('results.winner')}</h2>
              <p className="text-2xl text-gray-700 mb-6">{winner.name}</p>
              <div className="text-sm text-gray-500 uppercase tracking-widest">{t('results.basedOn')}</div>
              <button onClick={() => setView('scorecard')} className="mt-8 text-golf-deep underline font-bold">{t('results.viewScorecard')}</button>
            </div>
          </div>
        )}

        {view === 'credits' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto text-center border-t-8 border-golf-deep">
            <h2 className="text-3xl font-bold text-golf-deep mb-6">{t('credits.title')}</h2>
            <div className="p-4 bg-golf-light/30 rounded-xl mb-6">
              <p className="text-lg leading-relaxed text-gray-700">
                {t('credits.description')}
              </p>
            </div>
            <div className="flex justify-center space-x-4 mb-8">
              <span className="text-4xl">⛳</span>
              <span className="text-4xl">🤖</span>
              <span className="text-4xl">📱</span>
            </div>
            <div className="text-gray-500 font-medium border-t pt-6">
              <p className="text-golf-deep font-bold text-lg">{t('credits.developer')}</p>
              <p className="text-sm">© {t('credits.rights')}</p>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100">
              <button onClick={() => setView('calibrate')} className="text-xs text-gray-300 hover:text-red-500 transition">Dev Mode</button>
            </div>
          </div>
        )}

        {view === 'calibrate' && (
          <div className="animate-fade-in-up">
            <CalibrationView />
          </div>
        )}
      </main>

      <footer className="bg-golf-deep/10 p-4 text-center mt-auto">
        <p className="text-sm text-golf-deep font-medium">
          {t('credits.developer')}, {t('credits.rights')}
        </p>
      </footer>
    </div>
  );
}

export default App;
