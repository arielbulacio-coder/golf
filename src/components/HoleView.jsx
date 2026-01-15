import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { recommendClub, calculateDistance } from '../utils/golfLogic';

// Helper for distance removed as it is now in App.jsx or not needed here for simple distance to hole (which uses calculateDistance utility)

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

const HoleNotes = ({ holeNumber }) => {
    const [notes, setNotes] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newNoteText, setNewNoteText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        const allNotes = JSON.parse(localStorage.getItem('golf_notes') || '{}');
        setNotes(allNotes[holeNumber] || []);
    }, [holeNumber]);

    const saveNotesToStorage = (updatedNotes) => {
        const allNotes = JSON.parse(localStorage.getItem('golf_notes') || '{}');
        allNotes[holeNumber] = updatedNotes;
        localStorage.setItem('golf_notes', JSON.stringify(allNotes));
    };

    const handleAddNote = () => {
        if (!newNoteText.trim()) return;
        const note = {
            id: Date.now(),
            text: newNoteText,
            date: new Date().toLocaleDateString()
        };
        const updated = [note, ...notes]; // Newest first
        setNotes(updated);
        saveNotesToStorage(updated);
        setNewNoteText('');
        setIsAdding(false);
    };

    const handleDelete = (id) => {
        if (!confirm('¿Eliminar nota?')) return;
        const updated = notes.filter(n => n.id !== id);
        setNotes(updated);
        saveNotesToStorage(updated);
    };

    const startEdit = (note) => {
        setEditingId(note.id);
        setEditText(note.text);
    };

    const handleUpdate = () => {
        if (!editText.trim()) return;
        const updated = notes.map(n => n.id === editingId ? { ...n, text: editText } : n);
        setNotes(updated);
        saveNotesToStorage(updated);
        setEditingId(null);
        setEditText('');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-gray-700 font-bold uppercase text-xs tracking-wider">📝 Notas del Hoyo</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-golf-deep font-bold text-sm bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition"
                >
                    {isAdding ? 'Cancelar' : '+ Nueva'}
                </button>
            </div>

            {isAdding && (
                <div className="mb-4 animate-fade-in-down">
                    <textarea
                        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-golf-accent outline-none mb-2"
                        rows="3"
                        placeholder="Escribe tu nota aquí..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                    ></textarea>
                    <button
                        onClick={handleAddNote}
                        className="w-full bg-golf-deep text-white font-bold py-2 rounded-lg text-sm shadow hover:bg-golf-dark transition"
                    >
                        Guardar Nota
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {notes.length === 0 && !isAdding && (
                    <p className="text-center text-gray-400 text-sm italic py-2">No hay notas para este hoyo.</p>
                )}
                {notes.map(note => (
                    <div key={note.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 relative group">
                        {editingId === note.id ? (
                            <div className="animate-fade-in">
                                <textarea
                                    className="w-full border rounded p-2 text-sm mb-2"
                                    rows="3"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                ></textarea>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 font-bold px-2">Cancelar</button>
                                    <button onClick={handleUpdate} className="text-xs bg-green-600 text-white px-3 py-1 rounded font-bold">Actualizar</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-800 text-sm whitespace-pre-wrap">{note.text}</p>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="text-[10px] text-gray-400">{note.date}</span>
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(note)} className="text-blue-500 hover:text-blue-700 text-xs font-bold">Editar</button>
                                        <button onClick={() => handleDelete(note.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Borrar</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const HoleView = ({ hole, onNextHole, onPrevHole, onUpdateScore, players, scores, weather }) => {
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
    // const lastPosRef = useRef(null); // Moved to App.jsx

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
            },
            (error) => {
                console.error(error);
                setLocationError("GPS Error: " + error.message);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [hole]);

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

            {/* Notes Section */}
            <HoleNotes holeNumber={hole.number} />

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
