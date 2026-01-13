import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { recommendClub, calculateDistance } from '../utils/golfLogic';

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

const HoleView = ({ hole, onNextHole, onPrevHole, onUpdateScore, players, scores, weather, fitnessStats, onUpdateFitness }) => {
    const { t } = useTranslation();
    const [userLocation, setUserLocation] = useState(null);
    const [distance, setDistance] = useState(hole.yards);
    const [club, setClub] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Weather Data
    const windSpeed = weather ? weather.wind_speed : 10;
    const windDirection = weather ? weather.wind_dir : 0;
    const temperature = weather ? weather.temp : 20;

    const [locationError, setLocationError] = useState(null);
    const [heading, setHeading] = useState(0);
    const [compassActive, setCompassActive] = useState(false);

    // GPS Tracking Ref
    const lastPosRef = useRef(null);

    // Compass Logic
    useEffect(() => {
        const handleOrientation = (e) => {
            let compass = e.webkitCompassHeading || (e.alpha ? Math.abs(e.alpha - 360) : 0);
            setHeading(compass || 0);
            if (e.webkitCompassHeading || e.alpha !== null) setCompassActive(true);
        };

        if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
            window.addEventListener('deviceorientation', handleOrientation);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    const requestCompassPermission = () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        setCompassActive(true);
                        window.addEventListener('deviceorientation', (e) => {
                            let compass = e.webkitCompassHeading || (e.alpha ? Math.abs(e.alpha - 360) : 0);
                            setHeading(compass || 0);
                            setCompassActive(true);
                        });
                    } else {
                        alert("Permiso de brújula denegado.");
                    }
                })
                .catch(console.error);
        }
    };

    // GPS & Fitness Logic
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            setLocationError("GPS requires HTTPS.");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Update Location state
                setUserLocation({ lat: latitude, lng: longitude });
                setLocationError(null);

                // Calculate Distance to Hole
                if (hole.coordinates) {
                    const dist = calculateDistance(latitude, longitude, hole.coordinates.lat, hole.coordinates.lng);
                    setDistance(dist);
                }

                // --- Fitness Tracking ---
                if (onUpdateFitness) {
                    if (lastPosRef.current) {
                        const dMeters = getDistanceFromLatLonInMeters(
                            lastPosRef.current.lat, lastPosRef.current.lng,
                            latitude, longitude
                        );

                        // Filter GPS jitter: only count movement > 5 meters
                        if (dMeters > 5 && dMeters < 500) { // <500 avoids teleport jumps
                            onUpdateFitness(prev => {
                                const newDist = prev.distance + dMeters;
                                // 0.75m per step average
                                const newSteps = Math.floor(newDist / 0.75);
                                // ~5 kcal per min walking, or approx 0.05 kcal per meter (assuming 70kg person walking)
                                const newCals = Math.floor(newDist * 0.05 + ((Date.now() - prev.startTime) / 60000) * 1.5);

                                return {
                                    ...prev,
                                    distance: newDist,
                                    steps: newSteps,
                                    calories: newCals
                                };
                            });
                            // Update last ref ONLY if moved
                            lastPosRef.current = { lat: latitude, lng: longitude };
                        }
                    } else {
                        // First valid point
                        lastPosRef.current = { lat: latitude, lng: longitude };
                    }
                }
            },
            (error) => {
                console.error(error);
                setLocationError("GPS Error: " + error.message);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [hole, onUpdateFitness]); // Re-run if hole changes (reset logic?) No, keep tracking continuously.

    // Force re-evaluation of lastPosRef on hole change? No, we want continuous tracking.
    // However, if component unmounts, ref is lost. But state is in App.
    // Ideally we'd persist lastPosRef in App too, but passing ref is tricky. 
    // For now, on Hole Change, we might "lose" the delta between holes if unmounted. 
    // HoleView likely stays mounted when changing holes props.

    // Club Recommendation
    useEffect(() => {
        const relativeWind = compassActive ? (windDirection - heading) : windDirection;
        setClub(recommendClub(distance, windSpeed, relativeWind));
    }, [distance, windSpeed, windDirection, heading, compassActive]);

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
                    {/* Compact Info Row */}
                    <div className="mt-2 pt-2 border-t border-white/20 flex justify-between items-center text-sm">
                        <div className="opacity-80">HCP {hole.handicap}</div>
                        <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs animate-pulse">
                            🔍 Ver Foto
                        </div>
                    </div>
                </div>
            </div>

            {/* Fitness Tracking Card */}
            {fitnessStats && (
                <div className="bg-black/90 backdrop-blur-sm text-white rounded-xl p-4 shadow-lg border border-gray-700 animate-slide-in">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-black text-green-400 uppercase tracking-widest flex items-center gap-1">
                            <span className="animate-pulse">●</span> Actividad en Vivo
                        </h3>
                        <span className="text-[10px] text-gray-400">GPS Traking On</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white/10 rounded-lg p-2">
                            <div className="text-xl font-bold">{fitnessStats.steps}</div>
                            <div className="text-[10px] text-gray-400 uppercase">Pasos</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2">
                            <div className="text-xl font-bold text-orange-400">{fitnessStats.calories}</div>
                            <div className="text-[10px] text-gray-400 uppercase">Kcal</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2">
                            <div className="text-xl font-bold text-blue-400">{(fitnessStats.distance / 1000).toFixed(2)}</div>
                            <div className="text-[10px] text-gray-400 uppercase">Km</div>
                        </div>
                    </div>
                    <div className="mt-2 text-center text-xs text-gray-500">
                        ⏱️ Tiempo de Juego: {Math.floor((Date.now() - fitnessStats.startTime) / 60000)} min
                    </div>
                </div>
            )}

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
                        {compassActive ? "Sugerencia dinámica (Apuntar)" : "Sugerencia estática"}
                    </div>
                </div>

                {/* Wind Highlight */}
                <div
                    onClick={requestCompassPermission}
                    className="cursor-pointer col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 text-white shadow-lg border border-blue-400/20 relative overflow-hidden active:scale-95 transition-transform"
                >
                    <div className="absolute bottom-0 left-0 -ml-2 -mb-2 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>

                    <div className="flex justify-between items-start mb-1">
                        <div className="text-xs font-black text-blue-200 uppercase tracking-wider">Viento {compassActive ? "Real" : "(Tap)"}</div>
                        <div className="text-xs font-bold text-white bg-blue-500/30 px-1.5 rounded">{temperature}°C</div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{windSpeed} <span className="text-xs font-normal">km/h</span></div>
                        <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full shadow-inner ring-1 ring-white/20">
                            {/* Wind From + 180 = Wind To. Minus Heading rotates opposite to compass. */}
                            <span style={{ transform: `rotate(${windDirection + 180 - heading}deg)`, display: 'inline-block', fontSize: '1.2rem', fontWeight: 'bold', transition: 'transform 0.5s ease-out' }}>⬆</span>
                        </div>
                    </div>
                    <div className="mt-2 text-[10px] text-blue-200 truncate">
                        {compassActive ? "Brújula Activa" : "Toque para brújula"}
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
