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

    // Simplified club recommendation: use real wind direction
    useEffect(() => {
        // windDirection from weather is wind FROM.
        // Course: assumed North for simple logic. 
        // We pass the raw direction and speed.
        setClub(recommendClub(distance, windSpeed, windDirection));
    }, [distance, windSpeed, windDirection]);

    return (
        <div className="flex flex-col min-h-full space-y-4 p-4 max-w-md mx-auto relative">
            {/* ... other code ... */}

            {/* Hole Header - slightly compacted to fit new highlights */}
            {/* ... same hole header ... */}

            {/* AI Caddy & Wind Highlight Container */}
            <div className="grid grid-cols-2 gap-3">
                {/* AI Suggestion */}
                <div className="col-span-1 bg-gradient-to-br from-golf-deep to-gray-800 rounded-2xl p-4 text-white shadow-lg border border-golf-accent/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-2 -mt-2 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>

                    <div className="text-xs font-black text-golf-accent uppercase tracking-wider mb-1">Caddy IA</div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        <span className="text-xl font-bold leading-none">{club}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-300">
                        Sugerencia basada en {distance}y + viento
                    </div>
                </div>

                {/* Wind Highlight */}
                <div className="col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 text-white shadow-lg border border-blue-400/20 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 -ml-2 -mb-2 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>

                    <div className="text-xs font-black text-blue-200 uppercase tracking-wider mb-1">Viento Real</div>
                    <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{windSpeed} <span className="text-xs font-normal">km/h</span></div>
                        <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full">
                            <span style={{ transform: `rotate(${windDirection + 180}deg)`, display: 'inline-block', fontSize: '1.2rem', fontWeight: 'bold' }}>⬆</span>
                        </div>
                    </div>
                    <div className="mt-2 text-[10px] text-blue-200">
                        {windDirection}° (Desde el Norte)
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
