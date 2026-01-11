import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courses, players as initialPlayers } from './data/courses';
import HoleView from './components/HoleView';
import ScoreCard from './components/ScoreCard';
import CalibrationView from './components/CalibrationView';
import PlayersManager from './components/PlayersManager';

function App() {
  const { t, i18n } = useTranslation();
  const [currentCourse, setCurrentCourse] = useState(courses[0]);
  const [currentHoleNum, setCurrentHoleNum] = useState(1);
  const [players, setPlayers] = useState(initialPlayers);
  const [scores, setScores] = useState({}); // { playerId: { holeNum: score } }
  const [view, setView] = useState('hole'); // 'hole', 'scorecard', 'results', 'credits', 'players'
  const [winner, setWinner] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load players from backend on start
  useEffect(() => {
    fetch(`${API_URL}/api/players`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          // Merge or replace initial players. For now let's just use what's in DB if available, 
          // but we need to keep IDs unique. The DB uses auto-inc IDs which might conflict with static file.
          // Simplified strategy: Use DB players if present, else static.
          setPlayers(data.data);
        }
      })
      .catch(err => console.log("Offline or no backend players"));
  }, []);

  // Detect Course based on GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("Detected location:", latitude, longitude);

        const calculateDist = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        // Identify nearest course
        // We assume we have a list 'courses' with a central location?
        // Currently 'courses' has holes with coordinates. We can grab the first hole or an average.
        // Let's use the first hole of each course as reference for now, or assume 'location' field if we had coords there.
        // Since we don't have explicit course center coords in data, let's use Hole 1.

        let nearest = courses[0];
        let minDist = Infinity;

        courses.forEach(c => {
          if (c.holes && c.holes.length > 0) {
            const h1 = c.holes[0];
            if (h1.coordinates) {
              const dist = calculateDist(latitude, longitude, h1.coordinates.lat, h1.coordinates.lng);
              if (dist < minDist) {
                minDist = dist;
                nearest = c;
              }
            }
          }
        });

        if (minDist < 50) { // Only auto-switch if within 50km
          setCurrentCourse(nearest);
        }

      }, (err) => console.log("GPS denied, using default course"));
    }
  }, []);

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

    players.forEach(p => {
      const playerTotal = Object.values(scores[p.id] || {}).reduce((a, b) => a + b, 0);
      const netScore = playerTotal - p.handicap;

      if (netScore < minScore) {
        minScore = netScore;
        currentWinner = p;
      }
    });
    setWinner(currentWinner);
  };

  const handleSaveGame = () => {
    const payload = {
      course_id: currentCourse.id,
      scores: scores
    };

    fetch(`${API_URL}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => alert("Game Saved Successfully!"))
      .catch(() => alert("Failed to save game. Check connection."));
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-golf-light font-sans text-gray-800 flex flex-col">
      <nav className="bg-golf-deep text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {currentCourse.logo && <img src={currentCourse.logo} alt={currentCourse.name} className="h-12 w-12 rounded-full border-2 border-elegant-gold" />}
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">{currentCourse.name}</h1>
              <p className="text-xs text-golf-accent uppercase tracking-widest opacity-90">Caddy AI</p>
            </div>
          </div>
          <div className="space-x-4 text-sm font-medium flex items-center">
            <button onClick={() => setView('hole')} className={`hover:text-golf-accent transition ${view === 'hole' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.play')}</button>
            <button onClick={() => setView('scorecard')} className={`hover:text-golf-accent transition ${view === 'scorecard' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.scorecard')}</button>
            <button onClick={() => setView('players')} className={`hover:text-golf-accent transition ${view === 'players' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.players')}</button>
            <button onClick={() => setView('credits')} className={`hover:text-golf-accent transition ${view === 'credits' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.credits')}</button>

            <div className="flex space-x-1 ml-4 border-l border-white/20 pl-4">
              <button onClick={() => changeLanguage('es')} className={`text-lg hover:scale-110 transition ${i18n.language === 'es' ? 'opacity-100' : 'opacity-50'}`}>🇪🇸</button>
              <button onClick={() => changeLanguage('en')} className={`text-lg hover:scale-110 transition ${i18n.language === 'en' ? 'opacity-100' : 'opacity-50'}`}>🇺🇸</button>
              <button onClick={() => changeLanguage('zh')} className={`text-lg hover:scale-110 transition ${i18n.language === 'zh' ? 'opacity-100' : 'opacity-50'}`}>🇨🇳</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 flex-grow w-full">
        {view === 'hole' && (
          <HoleView
            hole={currentHole}
            players={players}
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
              players={players}
              holes={currentCourse.holes}
              scores={scores}
              currentHole={currentHoleNum}
            />
            <div className="text-center mt-8">
              <button
                onClick={handleSaveGame}
                className="bg-elegant-gold text-golf-deep font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-400 transition"
              >
                💾 {t('scorecard.saveGame')}
              </button>
            </div>
          </div>
        )}

        {view === 'players' && (
          <div className="animate-fade-in-up">
            <PlayersManager />
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
              <button onClick={() => setView('calibrate')} className="text-xs text-gray-300 hover:text-red-500 transition">{t('credits.devMode')}</button>
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
