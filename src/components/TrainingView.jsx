import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateDistance } from '../utils/golfLogic';

const TrainingView = () => {
    const { t } = useTranslation();
    const [shots, setShots] = useState([]);
    const [club, setClub] = useState('Driver');
    const [distance, setDistance] = useState('');
    const [outcome, setOutcome] = useState('straight'); // straight, left, right, short, long
    const [activeTab, setActiveTab] = useState('log'); // log, stats

    // GPS State
    const [startPos, setStartPos] = useState(null);
    const [gpsStatus, setGpsStatus] = useState('');

    const clubs = [
        "Driver", "3 Wood", "5 Wood", "Hybrid",
        "4 Iron", "5 Iron", "6 Iron", "7 Iron", "8 Iron", "9 Iron",
        "Pitching Wedge", "Sand Wedge", "Lob Wedge", "Putter"
    ];

    // Load from LocalStorage
    useEffect(() => {
        const savedShots = localStorage.getItem('golf_training_data');
        if (savedShots) {
            setShots(JSON.parse(savedShots));
        }
    }, []);

    const getCurrentLocation = (callback) => {
        if (!navigator.geolocation) {
            setGpsStatus("GPS no soportado");
            return;
        }
        setGpsStatus("Buscando señal...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setGpsStatus("");
                callback(position.coords);
            },
            (error) => {
                setGpsStatus("Error GPS: " + error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const startMeasurement = () => {
        getCurrentLocation((coords) => {
            setStartPos({ lat: coords.latitude, lng: coords.longitude });
            setGpsStatus("📍 Punto de inicio marcado");
        });
    };

    const finishMeasurement = () => {
        if (!startPos) {
            setGpsStatus("Primero marca el inicio");
            return;
        }
        getCurrentLocation((coords) => {
            const dist = calculateDistance(startPos.lat, startPos.lng, coords.latitude, coords.longitude);
            // Auto update distance field
            setDistance(dist);
            // Optionally clear start pos or keep it. Let's clear it to reset cycle.
            setStartPos(null);
            setGpsStatus(`📏 Distancia calculada: ${dist}y`);
        });
    };

    // Save to LocalStorage
    const saveShot = () => {
        if (!distance && outcome !== 'putter') return; // Basic validation

        const newShot = {
            id: Date.now(),
            date: new Date().toISOString(),
            club,
            distance: parseInt(distance) || 0,
            outcome
        };

        const updatedShots = [newShot, ...shots];
        setShots(updatedShots);
        localStorage.setItem('golf_training_data', JSON.stringify(updatedShots));
        setDistance('');
        setGpsStatus('');
        setStartPos(null);
    };

    const deleteShot = (id) => {
        const updated = shots.filter(s => s.id !== id);
        setShots(updated);
        localStorage.setItem('golf_training_data', JSON.stringify(updated));
    };

    const getStats = () => {
        const stats = {};

        shots.forEach(shot => {
            if (!stats[shot.club]) {
                stats[shot.club] = { totalDist: 0, count: 0, straight: 0 };
            }
            stats[shot.club].totalDist += shot.distance;
            stats[shot.club].count += 1;
            if (shot.outcome === 'straight') stats[shot.club].straight += 1;
        });

        return Object.keys(stats).map(club => {
            const data = stats[club];
            return {
                club,
                avgDist: Math.round(data.totalDist / data.count),
                accuracy: Math.round((data.straight / data.count) * 100),
                count: data.count
            };
        }).sort((a, b) => b.avgDist - a.avgDist); // Sort by distance
    };

    return (
        <div className="animate-fade-in-up space-y-6 pb-20">
            <h2 className="text-2xl font-bold text-golf-deep text-center">{t('training.title')}</h2>

            {/* Tabs */}
            <div className="flex justify-center space-x-4 mb-4">
                <button
                    onClick={() => setActiveTab('log')}
                    className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'log' ? 'bg-golf-deep text-white shadow-lg' : 'bg-white text-gray-500'}`}
                >
                    {t('training.logShot')}
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'stats' ? 'bg-golf-deep text-white shadow-lg' : 'bg-white text-gray-500'}`}
                >
                    {t('training.stats')}
                </button>
            </div>

            {/* Log Shot View */}
            {activeTab === 'log' && (
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                        {/* GPS Section */}
                        <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Medir con GPS</div>
                                {gpsStatus && <p className="text-[10px] text-blue-800 font-bold animate-pulse">{gpsStatus}</p>}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={startMeasurement}
                                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center gap-1 ${startPos ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white shadow-md active:scale-95'}`}
                                    disabled={!!startPos}
                                >
                                    <span>📍</span>
                                    <span>Inicio</span>
                                </button>
                                <button
                                    onClick={finishMeasurement}
                                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center gap-1 ${!startPos ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white shadow-md active:scale-95'}`}
                                    disabled={!startPos}
                                >
                                    <span>🏁</span>
                                    <span>Medir Fin</span>
                                </button>
                            </div>
                        </div>

                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('training.selectClub')}</label>
                        <select
                            value={club}
                            onChange={(e) => setClub(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 font-bold text-gray-800"
                        >
                            {clubs.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('training.distance')} (yds)</label>
                            <input
                                type="number"
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 font-bold text-2xl text-center"
                                placeholder="0"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('training.outcome')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['straight', 'left', 'right', 'short', 'long', 'duff'].map(o => (
                                    <button
                                        key={o}
                                        onClick={() => setOutcome(o)}
                                        className={`p-2 rounded-lg text-sm font-bold capitalize transition ${outcome === o ? 'bg-golf-accent text-golf-deep ring-2 ring-golf-deep' : 'bg-gray-100 text-gray-500'}`}
                                    >
                                        {t(`training.${o}`) || o}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={saveShot}
                            className="w-full mt-6 bg-golf-deep text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-golf-dark active:scale-95 transition"
                        >
                            {t('training.saveShot')}
                        </button>
                    </div>

                    <div className="mt-8">
                        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest mb-2 px-2">{t('training.recentShots')}</h3>
                        <div className="space-y-2">
                            {shots.slice(0, 5).map(shot => (
                                <div key={shot.id} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-10 rounded-full ${shot.outcome === 'straight' ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                                        <div>
                                            <p className="font-bold text-gray-800">{shot.club}</p>
                                            <p className="text-xs text-gray-400">{new Date(shot.date).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-xl">{shot.distance}y</p>
                                            <p className="text-xs text-gray-500 capitalize">{t(`training.${shot.outcome}`) || shot.outcome}</p>
                                        </div>
                                        <button onClick={() => deleteShot(shot.id)} className="text-red-300 hover:text-red-500 p-2">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats View */}
            {activeTab === 'stats' && (
                <div className="space-y-4">
                    {getStats().length === 0 ? (
                        <div className="text-center p-8 text-gray-400">
                            <p>{t('training.noData')}</p>
                        </div>
                    ) : (
                        getStats().map(stat => (
                            <div key={stat.club} className="bg-white p-4 rounded-xl shadow-md border-l-4 border-golf-deep">
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="text-xl font-bold text-golf-deep">{stat.club}</h3>
                                    <span className="text-xs text-gray-400">{stat.count} tiros</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-gray-500 uppercase">{t('training.avgDist')}</div>
                                        <div className="text-xl font-bold text-gray-800">{stat.avgDist}y</div>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                                        <div className="text-xs text-gray-500 uppercase">{t('training.accuracy')}</div>
                                        <div className={`text-xl font-bold ${stat.accuracy > 70 ? 'text-green-600' : 'text-orange-500'}`}>{stat.accuracy}%</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-sm text-yellow-800">
                        <p className="font-bold mb-1">💡 Tip:</p>
                        <p>Usa estos datos para ajustar tus palos en el juego real. Si saca 150y con el Hierro 7 en promedio, ¡confía en ese número!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainingView;
