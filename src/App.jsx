import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { courses, players as initialPlayers } from './data/courses';
import HoleView from './components/HoleView';
import ScoreCard from './components/ScoreCard';
import WeatherView from './components/WeatherView';
import CalibrationView from './components/CalibrationView';
import PlayersManager from './components/PlayersManager';
import GamesHistory from './components/GamesHistory';
import GolfRules from './components/GolfRules';
import GolfClubs from './components/GolfClubs';
import GolfSimulator from './components/GolfSimulator';
import TrainingView from './components/TrainingView';
import { registerSW } from 'virtual:pwa-register';

function App() {
  // PWA Auto-Update Logic
  useEffect(() => {
    const updateSW = registerSW({
      onRegisteredSW(swUrl, r) {
        r && setInterval(() => {
          r.update();
        }, 60 * 1000); // Check for updates every minute
      }
    });

    // Reload page when new SW takes control
    let refreshing = false;
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return () => { };
  }, []);


  const { t, i18n } = useTranslation();
  const [currentCourse, setCurrentCourse] = useState(courses[0]);
  const [currentHoleNum, setCurrentHoleNum] = useState(1);
  const [players, setPlayers] = useState([]);
  const [setupMode, setSetupMode] = useState(true);
  const [scores, setScores] = useState({});
  const [view, setView] = useState('hole');
  const [winner, setWinner] = useState(null);
  const [historyGame, setHistoryGame] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [scoringType, setScoringType] = useState('stroke_net'); // stroke_net, stableford, scratch

  // Determine API_URL dynamically
  let API_URL = 'http://localhost:3001'; // Default for local dev
  if (window.location.hostname.includes('github.io')) {
    API_URL = import.meta.env.VITE_API_URL || 'http://35.192.208.127:3001';
  } else if (window.location.hostname !== 'localhost') {
    // If served from the backend (IP address), use relative path to respect protocol (HTTP/HTTPS)
    API_URL = '';
  }

  // Load players from backend on start
  useEffect(() => {
    if (window.location.hostname.includes('github.io')) {
      // Load from local storage if needed, or start empty
      const saved = localStorage.getItem('golf_players');
      if (saved) {
        setPlayers(JSON.parse(saved));
        setSetupMode(false);
      }
      return;
    }

    fetch(`${API_URL}/api/players`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          setPlayers(data.data);
          setSetupMode(false);
        } else {
          setSetupMode(true);
        }
      })
      .catch(err => {
        console.log("Offline or no backend players");
        setSetupMode(true);
      });
  }, []);

  // Fetch Weather based on Course Location
  // Fetch Weather based on Course Location (Open-Meteo API, works on GH Pages)
  useEffect(() => {
    // Medal's location: -34.4442, -58.9665
    // Open-Meteo is free and supports CORS
    const lat = -34.4442;
    const lng = -58.9665;

    // We fetch current weather + hourly to simulate forecast
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Flatten data to match expected structure or adapt the view
        if (data.current) {
          setWeatherData({
            temp: data.current.temperature_2m,
            wind_speed: data.current.wind_speed_10m,
            wind_dir: data.current.wind_direction_10m,
            description: "Weather Code " + data.current.weather_code, // ideally map codes to text
            humidity: data.current.relative_humidity_2m,
            feels_like: data.current.apparent_temperature,
            daily: data.daily, // Pass daily for forecast
            hourly: data.hourly // Pass hourly for day forecast
          });
        }
      })
      .catch(err => console.error("Weather fetch failed", err));
  }, [currentCourse]);

  // Detect Course based on GPS... (existing code)

  // ... existing code ...

  const currentHole = currentCourse.holes.find(h => h.number === currentHoleNum);

  // ... existing handlers ...

  const handleViewHistory = (game) => {
    let parsedScores = {};
    let parsedPlayers = [];
    try {
      parsedScores = typeof game.scores === 'string' ? JSON.parse(game.scores) : game.scores;
      // Try to get players from snapshot, otherwise empty (or we could fallback to current if IDs match, but unsafe)
      parsedPlayers = game.players ? (typeof game.players === 'string' ? JSON.parse(game.players) : game.players) : [];

      // If legacy game without players snapshot, we might just show scores with IDs?
      // Or if we have simple IDs in scores keys, we can try to map mock players:
      if (parsedPlayers.length === 0) {
        Object.keys(parsedScores).forEach(pid => {
          parsedPlayers.push({ id: pid, name: `Player ${pid}`, handicap: 0 });
        });
      }
    } catch (e) {
      console.error("Error parsing history game", e);
      return;
    }

    setHistoryGame({
      ...game,
      scores: parsedScores,
      players: parsedPlayers
    });
    setView('history_scorecard');
  };

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
    let bestScore = scoringType === 'stableford' ? -Infinity : Infinity;
    let currentWinner = null;

    players.forEach(p => {
      let total = 0;

      // Calculate total based on scoring type
      if (scoringType === 'scratch') {
        total = Object.values(scores[p.id] || {}).reduce((a, b) => a + b, 0);
        if (total < bestScore) {
          bestScore = total;
          currentWinner = p;
        }
      } else if (scoringType === 'stroke_net') {
        const gross = Object.values(scores[p.id] || {}).reduce((a, b) => a + b, 0);
        total = gross - p.handicap;
        if (total < bestScore) {
          bestScore = total;
          currentWinner = p;
        }
      } else if (scoringType === 'stableford') {
        // Simple Stableford calculation
        // For each hole:
        // Net Score = Stroke - (Handicap Strokes for that hole)
        // Points = Par + 2 - Net Score
        // We need hole par data here.
        // Simplified: We will use global handicap/18 for now or just Net Diff from Par
        // Let's use a simplified version: (Par of hole - (Score - Handicap/18)) + 2
        // Actually, without hole-by-hole handicap difficulty (stroke index), we can only approximate.
        // We will assume Handicap is distributed evenly for this demo or just use Net Difference.

        const pScores = scores[p.id] || {};
        let points = 0;
        Object.keys(pScores).forEach(holeNum => {
          const hole = currentCourse.holes.find(h => h.number === parseInt(holeNum));
          if (hole) {
            const strokes = pScores[holeNum];
            const freeStrokes = Math.round(p.handicap / 18); // Simplified distribution
            const netStrokes = strokes - freeStrokes;
            const holePoints = (hole.par - netStrokes) + 2;
            if (holePoints > 0) points += holePoints;
          }
        });
        total = points;
        if (total > bestScore) { // Higher is better for Stableford
          bestScore = total;
          currentWinner = p;
        }
      }
    });
    setWinner(currentWinner);
  };

  const handleSaveGame = () => {
    const gameData = {
      id: Date.now(),
      course_id: currentCourse.id,
      scores: JSON.stringify(scores),
      players: JSON.stringify(players), // Snapshot of current players
      date: new Date().toISOString(),
      winner: winner ? winner.name : 'Unknown'
    };

    if (window.location.hostname.includes('github.io')) {
      const savedGames = JSON.parse(localStorage.getItem('golf_games_history') || '[]');
      savedGames.push(gameData);
      localStorage.setItem('golf_games_history', JSON.stringify(savedGames));
      alert("¡Juego guardado localmente!");
      return;
    }

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
      .catch(() => {
        // Fallback to local if server fails
        const savedGames = JSON.parse(localStorage.getItem('golf_games_history') || '[]');
        savedGames.push(gameData);
        localStorage.setItem('golf_games_history', JSON.stringify(savedGames));
        alert("¡Sin conexión! Juego guardado localmente.");
      });
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="h-full bg-golf-light font-sans text-gray-800 flex flex-col overflow-hidden supports-[height:100dvh]:h-[100dvh]">
      <nav className="bg-golf-deep text-white p-4 pt-safe shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {currentCourse.logo && <img src={currentCourse.logo} alt={currentCourse.name} className="h-12 w-12 rounded-full border-2 border-elegant-gold" />}
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">{currentCourse.name}</h1>
              <p className="text-xs text-golf-accent uppercase tracking-widest opacity-90">Caddy AI v3.1</p>
            </div>
          </div>
          <div className="space-x-4 text-sm font-medium flex items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide mask-fade">
            <button onClick={() => setView('hole')} className={`hover:text-golf-accent transition ${view === 'hole' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.play')}</button>
            <button onClick={() => setView('scorecard')} className={`hover:text-golf-accent transition ${view === 'scorecard' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.scorecard')}</button>
            <button onClick={() => setView('players')} className={`hover:text-golf-accent transition ${view === 'players' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.players')}</button>
            <button onClick={() => setView('history')} className={`hover:text-golf-accent transition ${view === 'history' ? 'text-golf-accent' : 'opacity-80'}`}>📂 {t('nav.history')}</button>
            <button onClick={() => setView('weather')} className={`hover:text-golf-accent transition ${view === 'weather' ? 'text-golf-accent' : 'opacity-80'}`}>☀️ {t('weather.current')}</button>
            <button onClick={() => setView('simulator')} className={`hover:text-golf-accent transition ${view === 'simulator' ? 'text-golf-accent' : 'opacity-80'}`}>🎮 {t('nav.simulator')}</button>
            <button onClick={() => setView('training')} className={`hover:text-golf-accent transition ${view === 'training' ? 'text-golf-accent' : 'opacity-80'}`}>🎯 {t('training.title')}</button>
            <button onClick={() => setView('rules')} className={`hover:text-golf-accent transition ${view === 'rules' ? 'text-golf-accent' : 'opacity-80'}`}>📜 {t('nav.rules')}</button>
            <button onClick={() => setView('clubs')} className={`hover:text-golf-accent transition ${view === 'clubs' ? 'text-golf-accent' : 'opacity-80'}`}>🎒 {t('nav.clubs')}</button>
            <button onClick={() => setView('credits')} className={`hover:text-golf-accent transition ${view === 'credits' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.credits')}</button>

            <div className="flex space-x-1 ml-4 border-l border-white/20 pl-4">
              {/* ... langs ... */}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-4 px-4 flex-grow w-full overflow-y-auto overscroll-y-contain scroll-smooth pb-safe">
        {(view === 'players' || setupMode) && (
          <div className="animate-fade-in-up">
            {setupMode && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="font-bold text-yellow-700">¡Bienvenido! Agrega los jugadores para comenzar.</p>
              </div>
            )}
            <PlayersManager
              scoringType={scoringType}
              onSetScoringType={setScoringType}
              onPlayersChange={(updatedPlayers) => {
                setPlayers(updatedPlayers);
                if (window.location.hostname.includes('github.io')) {
                  localStorage.setItem('golf_players', JSON.stringify(updatedPlayers));
                }
                if (updatedPlayers.length > 0) setSetupMode(false);
              }}
              playersList={players}
            />
            {!setupMode && view === 'players' && (
              <button onClick={() => setView('hole')} className="w-full mt-4 bg-golf-deep text-white py-3 rounded-xl font-bold shadow-lg">
                ✅ Volver al Juego
              </button>
            )}
          </div>
        )}

        {!setupMode && view === 'hole' && (
          <HoleView
            hole={currentHole}
            players={players}
            scores={scores}
            weather={weatherData}
            onNextHole={handleNextHole}
            onPrevHole={handlePrevHole}
            onUpdateScore={handleScoreUpdate}
          />
        )}

        {view === 'weather' && (
          <WeatherView weather={weatherData} />
        )}

        {!setupMode && view === 'history' && (
          <GamesHistory onViewGame={handleViewHistory} />
        )}

        {view === 'history_scorecard' && historyGame && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-golf-deep">📜 Tarjeta Histórica</h2>
              <button onClick={() => { setHistoryGame(null); setView('history'); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm">
                ↩ Volver
              </button>
            </div>
            <div className="bg-white p-2 rounded-lg mb-4 text-xs text-center border border-gray-100">
              {new Date(historyGame.date).toLocaleString()}
            </div>
            <ScoreCard
              players={historyGame.players}
              holes={currentCourse.holes}
              scores={historyGame.scores}
              currentHole={18} // Show full
              scoringType={scoringType}
            />
          </div>
        )}

        {view === 'rules' && <GolfRules />}
        {view === 'clubs' && <GolfClubs />}
        {view === 'simulator' && <GolfSimulator />}
        {view === 'training' && <TrainingView />}

        {/* ... other views ... */}

        {view === 'scorecard' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-golf-deep text-center">{currentCourse.name}</h2>
            <ScoreCard
              players={players}
              holes={currentCourse.holes}
              scores={scores}
              currentHole={currentHoleNum}
              scoringType={scoringType}
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
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto text-center border-t-8 border-golf-deep animate-fade-in">
            <h2 className="text-3xl font-bold text-golf-deep mb-6">{t('credits.title')}</h2>
            <div className="p-4 bg-golf-light/30 rounded-xl mb-6">
              <p className="text-lg leading-relaxed text-gray-700">
                {t('credits.description')}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6 my-6">
              <h3 className="text-xl font-bold text-golf-deep mb-2">📞 {t('credits.contact')}</h3>
              <a
                href="https://wa.me/5491168987786"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-green-600 transition"
              >
                <span>💬</span> {t('credits.whatsapp')}
              </a>
            </div>

            <div className="border-t border-gray-100 pt-6 my-6 bg-gray-50 rounded-xl p-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">🤝 {t('credits.sponsorsTitle')}</h3>
              <p className="text-sm text-gray-500 italic mb-4">{t('credits.sponsorsDesc')}</p>
              <div className="flex flex-wrap justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Placeholder Sponsors - Replace with real logos */}
                <div className="w-24 h-12 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500">Sponsor 1</div>
                <div className="w-24 h-12 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500">Sponsor 2</div>
                <div className="w-24 h-12 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500">Sponsor 3</div>
              </div>
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
    </div>
  );
}

export default App;
