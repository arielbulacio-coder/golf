import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { recommendClub, calculateDistance } from '../utils/golfLogic';

const HoleView = ({ hole, onNextHole, onPrevHole, onUpdateScore, players, scores, weather }) => {
    const { t } = useTranslation();
    const [userLocation, setUserLocation] = useState(null);
    const [distance, setDistance] = useState(hole.yards); // Default to hole yards
    const [club, setClub] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Use current weather if available, otherwise fallback
    const windSpeed = weather ? weather.windspeed : 10;
    // Map degrees to simple direction for now, or pass degrees to logic
    // For visual simplicity let's stick to head/tailwind logic assumption or just show direction
    // In valid range 0-360. Let's assume Hole orientation is North (0) for simplicity unless we have hole bearing.
    // If hole is North (0), wind 180 is Headwind.
    // Real logic would require Course/Hole bearing data. 
    // We will pass raw speed/direction to logic later if needed, but for now lets keep the variable names
    // so we display real data.
    const windDirection = weather ? weather.winddirection : 0;

    const [locationError, setLocationError] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        // Check for Secure Context (HTTPS) which is required for Geolocation on modern browsers
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            setLocationError("GPS requires HTTPS. 'Full Cloud' mode on HTTP cannot access location due to browser security.");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                setLocationError(null);

                if (hole.coordinates) {
                    const dist = calculateDistance(latitude, longitude, hole.coordinates.lat, hole.coordinates.lng);
                    setDistance(dist);
                }
            },
            (error) => {
                console.error(error);
                let msg = "GPS Error: ";
                switch (error.code) {
                    case error.PERMISSION_DENIED: msg += "Permission Denied"; break;
                    case error.POSITION_UNAVAILABLE: msg += "Position Unavailable"; break;
                    case error.TIMEOUT: msg += "Timeout"; break;
                    default: msg += error.message;
                }
                setLocationError(msg);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [hole]);

    useEffect(() => {
        // Simplified club recommendation: Headwind if wind comes from opposite direction?
        // Let's pass 'headwind' or 'tailwind' based on a naive calculation or just pass the speed
        // Actually golfLogic might expect string. Let's check. 
        // Logic was simple string matching. We should update golfLogic if we want real precision.
        // For now, let's pretend > 10km/h is strong enough to factor in.
        const directionStr = 'headwind'; // Default hardcoded for safety until we have hole bearing
        setClub(recommendClub(distance, windSpeed, directionStr));
    }, [distance, windSpeed]);

    return (
        <div className="flex flex-col min-h-full space-y-4 p-4 max-w-md mx-auto relative">
            {/* Hole Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in" onClick={() => setShowPreview(false)}>
                    <div className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden shadow-2xl">
                        <button className="absolute top-2 right-2 bg-white/50 rounded-full p-2 text-black hover:bg-white transition" onClick={() => setShowPreview(false)}>
                            ✕
                        </button>
                        <img src={hole.image} alt={`Hole ${hole.number}`} className="w-full h-auto object-cover" />
                        <div className="p-4 bg-golf-deep text-white">
                            <h3 className="text-xl font-bold">{t('hole.title')} {hole.number} - {t('hole.par')} {hole.par}</h3>
                            <p className="text-sm opacity-80">{t('hole.yards')} {hole.yards}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Hole Header */}
            {locationError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded text-xs" role="alert">
                    <p className="font-bold">GPS Alert</p>
                    <p>{locationError}</p>
                </div>
            )}
            <div
                className="bg-golf-deep text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group cursor-pointer"
                onClick={() => setShowPreview(true)}
            >
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition duration-500">
                    <img src={hole.image} alt="Hole Background" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-golf-deep via-golf-deep/80 to-transparent z-0"></div>

                <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold leading-none -mr-4 -mt-4 z-0">
                    {hole.number}
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h2 className="text-3xl font-bold drop-shadow-md">{t('hole.title')} {hole.number}</h2>
                            <span className="text-golf-accent font-medium uppercase tracking-wider drop-shadow-md">{t('hole.par')} {hole.par}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold drop-shadow-md">{distance}</div>
                            <div className="text-xs opacity-80 uppercase tracking-widest drop-shadow-md">{t('hole.yards')}</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                        <div>
                            <p className="text-sm opacity-80 drop-shadow-md">{t('hole.handicap')}</p>
                            <p className="font-bold drop-shadow-md">{hole.handicap}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-80 drop-shadow-md">{t('hole.wind')}</p>
                            <p className="font-bold drop-shadow-md flex items-center gap-1">
                                {windSpeed} km/h
                                <span style={{ transform: `rotate(${windDirection}deg)`, display: 'inline-block' }}>➤</span>
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-xs uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">Tap to View Hole</span>
                    </div>
                </div>
            </div>

            {/* AI Caddy */}
            <div className="bg-gradient-to-r from-elegant-gold to-yellow-600 rounded-xl p-4 text-white shadow-lg transform transition hover:scale-105 duration-300">
                <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        ✨
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-90">{t('hole.aiSuggestion')}</p>
                        <p className="text-xl font-bold">{club}</p>
                    </div>
                </div>
            </div>

            {/* Scoring */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-golf-light mb-4">
                <h3 className="text-golf-deep font-bold mb-4 uppercase text-xs tracking-wider border-b pb-2">{t('hole.scoring')}</h3>
                <div className="space-y-4">
                    {players.map(player => (
                        <div key={player.id} className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-800">{player.name}</p>
                                <p className="text-xs text-gray-500">{t(`playerType.${player.type}`)} • HCP {player.handicap}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    className="w-10 h-10 rounded-full bg-gray-200 text-golf-dark hover:bg-gray-300 flex items-center justify-center text-xl font-bold shadow-sm active:scale-95 transition"
                                    onClick={() => onUpdateScore(player.id, (scores[player.id]?.[hole.number] || hole.par) - 1)}
                                >-</button>
                                <span className="w-8 text-center font-bold text-2xl text-golf-deep">{scores[player.id]?.[hole.number] || '-'}</span>
                                <button
                                    className="w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center text-xl font-bold shadow-sm active:scale-95 transition"
                                    onClick={() => onUpdateScore(player.id, (scores[player.id]?.[hole.number] || hole.par) + 1)}
                                >+</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spacer for content below sticky nav if needed */}
            <div className="flex-grow"></div>

            {/* Navigation - Sticky Bottom */}
            <div className="sticky bottom-0 left-0 right-0 pt-4 pb-safe -mx-4 px-4 bg-golf-light/95 backdrop-blur-md border-t border-golf-deep/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] mt-auto z-10 flex justify-between">
                <button
                    onClick={onPrevHole}
                    disabled={hole.number === 1}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${hole.number === 1 ? 'bg-gray-200 text-gray-400' : 'bg-white text-golf-deep shadow hover:shadow-md'}`}
                >
                    {t('hole.previous')}
                </button>
                <button
                    onClick={onNextHole}
                    className="px-6 py-3 rounded-lg font-bold bg-golf-deep text-white shadow-lg hover:bg-golf-dark transition-all"
                >
                    {hole.number === 18 ? t('hole.finish') : t('hole.next')}
                </button>
            </div>
        </div>
    );
};

export default HoleView;
