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

import { Analytics } from './services/analytics';
import { registerSW } from 'virtual:pwa-register';

// Helper for distance between two lat/lng points in meters
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Activity View Component
const ActivityView = ({ stats, dailyHoles, historyStats }) => (
  <div className="animate-fade-in-up bg-white rounded-2xl shadow-xl p-6 border-t-8 border-green-500 max-w-md mx-auto">
    <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
      <span className="text-4xl">🏃‍♂️</span> Actividad
    </h2>

    {/* Live Stats */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Hoyos Hoy</div>
        <div className="text-4xl font-black text-golf-deep">{dailyHoles}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Distancia</div>
        <div className="text-2xl font-black text-blue-500">{(stats.distance / 1000).toFixed(2)} <span className="text-xs text-gray-400">km</span></div>
      </div>
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Pasos</div>
        <div className="text-2xl font-black text-gray-700">{stats.steps}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Calorías</div>
        <div className="text-2xl font-black text-orange-500">{stats.calories} <span className="text-xs text-gray-400">kcal</span></div>
      </div>
    </div>

    {/* Historical Summaries */}
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">📅 Resumen Histórico</h3>

      {/* Holes Summary */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">⛳ Hoyos Jugados</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Semana</div>
            <div className="font-bold text-blue-700">{historyStats.weeklyHoles}</div>
          </div>
          <div className="bg-green-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Mes</div>
            <div className="font-bold text-green-700">{historyStats.monthlyHoles}</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-bold text-yellow-700">{historyStats.totalHoles}</div>
          </div>
        </div>
      </div>

      {/* Distance Summary */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">📏 Distancia (km)</h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Hoy</div>
            <div className="font-bold text-gray-700">{(historyStats.dailyDist / 1000).toFixed(1) || "0.0"}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Semana</div>
            <div className="font-bold text-gray-700">{(historyStats.weeklyDist / 1000).toFixed(1)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Mes</div>
            <div className="font-bold text-gray-700">{(historyStats.monthlyDist / 1000).toFixed(1)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-bold text-gray-700">{(historyStats.totalDist / 1000).toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Steps Summary */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">🦶 Pasos</h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-orange-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Hoy</div>
            <div className="font-bold text-gray-700">{historyStats.dailySteps?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-orange-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Semana</div>
            <div className="font-bold text-gray-700">{historyStats.weeklySteps?.toLocaleString()}</div>
          </div>
          <div className="bg-orange-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Mes</div>
            <div className="font-bold text-gray-700">{historyStats.monthlySteps?.toLocaleString()}</div>
          </div>
          <div className="bg-orange-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-bold text-orange-800">{historyStats.totalSteps?.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Calories Summary */}
      <div>
        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">🔥 Calorías</h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-red-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Hoy</div>
            <div className="font-bold text-gray-700">{historyStats.dailyCals?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-red-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Semana</div>
            <div className="font-bold text-gray-700">{historyStats.weeklyCals?.toLocaleString()}</div>
          </div>
          <div className="bg-red-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Mes</div>
            <div className="font-bold text-gray-700">{historyStats.monthlyCals?.toLocaleString()}</div>
          </div>
          <div className="bg-red-50 p-2 rounded-lg">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-bold text-red-600">{historyStats.totalCals?.toLocaleString()}</div>
          </div>
        </div>
      </div>

    </div>

    <div className="bg-green-50 text-green-800 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
      GPS Tracking Activo
    </div>
  </div>
);

function App() {
  const APP_VERSION = 'v3.7';

  // PWA Auto-Update Logic - AGGRESSIVE
  useEffect(() => {
    // 1. Standard vite-plugin-pwa register
    const updateSW = registerSW({
      onRegisteredSW(swUrl, r) {
        console.log('SW Registered:', swUrl);
        // Check immediately
        r && r.update();
        // Check every interval
        r && setInterval(() => {
          console.log('Checking for SW update...');
          r.update();
        }, 60 * 1000);
      },
      onNeedRefresh() {
        console.log('SW Need Refresh - Reloading...');
        updateSW(true); // Force update
      }
    });

    // 2. Extra Safety: Force update on existing registrations
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }

    // 3. Reload logic
    let refreshing = false;
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return () => { };
  }, []);

  // Track Visit Publicly (No Backend)
  useEffect(() => {
    Analytics.trackVisit();
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
  const [adminStats, setAdminStats] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [scoringType, setScoringType] = useState('stroke_net'); // stroke_net, stableford, scratch

  // Activity History State
  const [dailyHoles, setDailyHoles] = useState(0);
  const [activityHistory, setActivityHistory] = useState({
    weeklyHoles: 0,
    monthlyHoles: 0,
    totalHoles: 0,
    // Add accumulated stats
    dailyDist: 0,
    weeklyDist: 0,
    monthlyDist: 0,
    totalDist: 0,
    dailySteps: 0,
    weeklySteps: 0,
    monthlySteps: 0,
    totalSteps: 0,
    dailyCals: 0,
    weeklyCals: 0,
    monthlyCals: 0,
    totalCals: 0
  });

  // Load Activity History
  useEffect(() => {
    try {
      const saved = localStorage.getItem('golf_activity_history');
      if (saved) {
        const data = JSON.parse(saved);
        // Check if it's a new day to reset daily holes
        const lastDate = new Date(data.lastDate || 0);
        const now = new Date();
        if (lastDate.toDateString() !== now.toDateString()) {
          setDailyHoles(0);
          data.dailyDist = 0;
          data.dailySteps = 0;
          data.dailyCals = 0;
          // We could also do weekly/monthly reset logic here if we tracked exact dates
        } else {
          setDailyHoles(data.dailyHoles || 0);
        }
        setActivityHistory(data);
      }
    } catch (e) {
      console.warn("Error loading activity history", e);
    }
  }, []);

  // Update Activity History Helper
  const incrementHoleCount = () => {
    setDailyHoles(prev => {
      const newVal = prev + 1;
      const newHistory = { ...activityHistory };
      newHistory.totalHoles = (newHistory.totalHoles || 0) + 1;
      newHistory.monthlyHoles = (newHistory.monthlyHoles || 0) + 1; // Simplified approximation
      newHistory.weeklyHoles = (newHistory.weeklyHoles || 0) + 1; // Simplified approximation
      newHistory.lastDate = new Date().toISOString();
      newHistory.dailyHoles = newVal;

      setActivityHistory(newHistory);
      localStorage.setItem('golf_activity_history', JSON.stringify(newHistory));
      return newVal;
    });
  };

  // Real-time Fitness State
  const [fitnessStats, setFitnessStats] = useState({
    distance: 0, // meters
    steps: 0,
    calories: 0,
    startTime: Date.now()
  });

  // Update Fitness ref for tracking delta
  const lastPosRef = React.useRef(null);

  // Global GPS Tracking for Fitness
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (lastPosRef.current) {
          const dMeters = getDistanceFromLatLonInMeters(
            lastPosRef.current.lat, lastPosRef.current.lng,
            latitude, longitude
          );

          // Filter GPS jitter: only count movement > 5 meters
          if (dMeters > 5 && dMeters < 500) {
            const dSteps = Math.floor(dMeters / 0.75);
            const dCals = Math.floor(dMeters * 0.05 + ((Date.now() - prev.startTime) / 60000) * 1.5);

            setFitnessStats(prev => {
              const newDist = prev.distance + dMeters;
              const newSteps = Math.floor(newDist / 0.75);
              const newCals = Math.floor(newDist * 0.05 + ((Date.now() - prev.startTime) / 60000) * 1.5);
              return { ...prev, distance: newDist, steps: newSteps, calories: newCals };
            });

            // Update Activity History Accumulators
            setActivityHistory(prevH => {
              const newH = { ...prevH };

              // Distance
              newH.totalDist = (newH.totalDist || 0) + dMeters;
              newH.monthlyDist = (newH.monthlyDist || 0) + dMeters;
              newH.weeklyDist = (newH.weeklyDist || 0) + dMeters;
              newH.dailyDist = (newH.dailyDist || 0) + dMeters;

              // Steps
              newH.totalSteps = (newH.totalSteps || 0) + dSteps;
              newH.monthlySteps = (newH.monthlySteps || 0) + dSteps;
              newH.weeklySteps = (newH.weeklySteps || 0) + dSteps;
              newH.dailySteps = (newH.dailySteps || 0) + dSteps;

              // Cals
              newH.totalCals = (newH.totalCals || 0) + dCals;
              newH.monthlyCals = (newH.monthlyCals || 0) + dCals;
              newH.weeklyCals = (newH.weeklyCals || 0) + dCals;
              newH.dailyCals = (newH.dailyCals || 0) + dCals;

              localStorage.setItem('golf_activity_history', JSON.stringify(newH));
              return newH;
            });

            lastPosRef.current = { lat: latitude, lng: longitude };
          }
        } else {
          lastPosRef.current = { lat: latitude, lng: longitude };
        }
      },
      (err) => console.log("GPS BG Error", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

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
    // Track hole completion for Activity
    incrementHoleCount();

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
              <p className="text-xs text-golf-accent uppercase tracking-widest opacity-90">Caddy AI {APP_VERSION}</p>
            </div>
          </div>
          <div className="space-x-4 text-sm font-medium flex items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide mask-fade">
            <button onClick={() => { setView('hole'); Analytics.trackEvent('play'); }} className={`hover:text-golf-accent transition ${view === 'hole' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.play')}</button>
            <button onClick={() => { setView('scorecard'); Analytics.trackEvent('scorecard'); }} className={`hover:text-golf-accent transition ${view === 'scorecard' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.scorecard')}</button>
            <button onClick={() => { setView('players'); Analytics.trackEvent('players'); }} className={`hover:text-golf-accent transition ${view === 'players' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.players')}</button>
            <button onClick={() => { setView('history'); Analytics.trackEvent('history'); }} className={`hover:text-golf-accent transition ${view === 'history' ? 'text-golf-accent' : 'opacity-80'}`}>📂 {t('nav.history')}</button>
            <button onClick={() => { setView('weather'); Analytics.trackEvent('weather'); }} className={`hover:text-golf-accent transition ${view === 'weather' ? 'text-golf-accent' : 'opacity-80'}`}>☀️ {t('weather.current')}</button>
            <button onClick={() => { setView('activity'); Analytics.trackEvent('activity'); }} className={`hover:text-golf-accent transition ${view === 'activity' ? 'text-golf-accent' : 'opacity-80'}`}>🏃Actividad</button>
            <button onClick={() => { setView('simulator'); Analytics.trackEvent('simulator'); }} className={`hover:text-golf-accent transition ${view === 'simulator' ? 'text-golf-accent' : 'opacity-80'}`}>🎮 {t('nav.simulator')}</button>
            <button onClick={() => { setView('training'); Analytics.trackEvent('training'); }} className={`hover:text-golf-accent transition ${view === 'training' ? 'text-golf-accent' : 'opacity-80'}`}>🎯 {t('training.title')}</button>
            <button onClick={() => { setView('rules'); Analytics.trackEvent('rules'); }} className={`hover:text-golf-accent transition ${view === 'rules' ? 'text-golf-accent' : 'opacity-80'}`}>📜 {t('nav.rules')}</button>
            <button onClick={() => { setView('clubs'); Analytics.trackEvent('clubs'); }} className={`hover:text-golf-accent transition ${view === 'clubs' ? 'text-golf-accent' : 'opacity-80'}`}>🎒 {t('nav.clubs')}</button>
            <button onClick={() => { setView('credits'); Analytics.trackEvent('credits'); }} className={`hover:text-golf-accent transition ${view === 'credits' ? 'text-golf-accent' : 'opacity-80'}`}>{t('nav.credits')}</button>

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
          // fitnessStats kept in App state tracking globally now
          />
        )}

        {view === 'weather' && (
          <WeatherView weather={weatherData} />
        )}

        {view === 'activity' && <ActivityView stats={fitnessStats} dailyHoles={dailyHoles} historyStats={activityHistory} />}

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
            {/* Admin Stats Modal */}
            {showAdminLogin && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full animate-fade-in-up">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">🔒 Admin Stats</h3>
                    <button onClick={() => { setShowAdminLogin(false); setAdminStats(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>

                  {!adminStats ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Ingresa el PIN de acceso:</p>
                      <input
                        type="password"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full text-center text-2xl font-bold tracking-widest border rounded p-2"
                        placeholder="••••"
                      />
                      <button
                        onClick={() => {
                          if (adminPin === '1209') { // Hardcoded simple pin
                            Analytics.getStats().then(setAdminStats);
                          } else {
                            alert("PIN Incorrecto");
                          }
                        }}
                        className="w-full bg-golf-deep text-white py-2 rounded-lg font-bold"
                      >
                        Ingresar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-sm text-gray-500 uppercase">Visitas Totales</div>
                        <div className="text-4xl font-black text-blue-600">{adminStats.visits}</div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm border-b mb-2 pb-1">🌍 Por País</h4>
                        {Object.entries(adminStats.locations).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                            <span>{k}</span>
                            <span className="font-bold text-golf-deep">{v}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm border-b mb-2 pb-1">🔥 Funciones Top</h4>
                        {Object.entries(adminStats.features).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                            <span>{k}</span>
                            <span className="font-bold text-golf-deep">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center">
              <button onClick={() => setView('calibrate')} className="text-xs text-gray-300 hover:text-red-500 transition">{t('credits.devMode')}</button>

              <button
                onClick={() => setShowAdminLogin(true)}
                className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded hover:bg-golf-deep hover:text-white transition flex items-center gap-1"
              >
                <span>🛡️</span> Admin
              </button>
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
