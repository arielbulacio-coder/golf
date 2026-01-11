import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { recommendClub, calculateDistance } from '../utils/golfLogic';

const HoleView = ({ hole, onNextHole, onPrevHole, onUpdateScore, players, scores }) => {
    const { t } = useTranslation();
    const [userLocation, setUserLocation] = useState(null);
    const [distance, setDistance] = useState(hole.yards); // Default to hole yards
    const [club, setClub] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Mock enviroment
    const windSpeed = 10;
    const windDirection = 'headwind';

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });

                    if (hole.coordinates) {
                        const dist = calculateDistance(latitude, longitude, hole.coordinates.lat, hole.coordinates.lng);
                        setDistance(dist);
                    }
                },
                (error) => console.log(error),
                { enableHighAccuracy: true }
            );
        }
    }, [hole]);

    useEffect(() => {
        setClub(recommendClub(distance, windSpeed, windDirection));
    }, [distance]);

    return (
        <div className="flex flex-col h-full space-y-4 p-4 max-w-md mx-auto">
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
                            <p className="font-bold drop-shadow-md">{windSpeed} mph {windDirection === 'headwind' ? '↓' : '↑'}</p>
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
            <div className="bg-white rounded-xl shadow-lg p-6 border border-golf-light">
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
                                    className="w-8 h-8 rounded-full bg-gray-100 text-golf-dark hover:bg-gray-200 flex items-center justify-center font-bold"
                                    onClick={() => onUpdateScore(player.id, (scores[player.id]?.[hole.number] || hole.par) - 1)}
                                >-</button>
                                <span className="w-8 text-center font-bold text-xl">{scores[player.id]?.[hole.number] || '-'}</span>
                                <button
                                    className="w-8 h-8 rounded-full bg-golf-DEFAULT text-white hover:bg-golf-dark flex items-center justify-center font-bold"
                                    onClick={() => onUpdateScore(player.id, (scores[player.id]?.[hole.number] || hole.par) + 1)}
                                >+</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
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
