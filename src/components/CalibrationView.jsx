import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CalibrationView = () => {
    const { t } = useTranslation();
    const [currentGPS, setCurrentGPS] = useState(null);
    const [selectedHole, setSelectedHole] = useState(1);
    const [capturedHoles, setCapturedHoles] = useState({}); // { 1: { lat, lng }, 2: ... }
    const [status, setStatus] = useState('');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Fetch holes from backend (assuming this is the intended use for API_URL, though the original component doesn't use fetched holes)
    // This useEffect block is incomplete in the provided instruction, so I'm adding a basic structure.
    // If you intended to use the fetched holes, you would need to add state to store them and logic to process them.
    useEffect(() => {
        // Example of fetching data, adjust as needed for your application's logic
        // For now, it just logs a message to show it's being called.
        // If you want to actually fetch and use holes, you'd need a state variable for them.
        // fetch(`${API_URL}/api/holes`)
        //   .then(res => res.json())
        //   .then(data => console.log("Fetched holes:", data))
        //   .catch(error => console.error("Error fetching holes:", error));
        console.log(`API_URL set to: ${API_URL}`);
    }, [API_URL]);

    // Watch GPS
    useEffect(() => {
        if (navigator.geolocation) {
            const id = navigator.geolocation.watchPosition(
                (pos) => {
                    setCurrentGPS({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(id);
        }
    }, []);

    const handleCapture = () => {
        if (!currentGPS) {
            alert("Waiting for GPS signal...");
            return;
        }

        setCapturedHoles(prev => ({
            ...prev,
            [selectedHole]: {
                lat: parseFloat(currentGPS.lat.toFixed(6)),
                lng: parseFloat(currentGPS.lng.toFixed(6))
            }
        }));

        // Auto advance to next hole
        if (selectedHole < 18) setSelectedHole(prev => prev + 1);
    };

    const generateCode = () => {
        // Generate the exact array string for courses.js
        // We take the existing structure concept but update coords
        return Object.entries(capturedHoles).map(([num, coords]) => {
            return `{ number: ${num}, ... coordinates: { lat: ${coords.lat}, lng: ${coords.lng} } },`;
        }).join('\n');
    };

    return (
        <div className="p-4 bg-white rounded-xl shadow-xl max-w-md mx-auto border-4 border-blue-500">
            <h2 className="text-xl font-bold text-blue-800 mb-2">📡 GPS Hardcode Helper</h2>
            <p className="text-xs text-gray-500 mb-4">Walk to the green, wait for accuracy &lt; 5m, then capture. At the end, copy the Code Snippet.</p>

            <div className="mb-4 bg-gray-100 p-3 rounded-lg flex justify-between items-center">
                <div>
                    <div className="text-xs font-bold uppercase text-gray-400">Current Position</div>
                    {currentGPS ? (
                        <div className="font-mono text-sm font-bold text-gray-700">
                            {currentGPS.lat.toFixed(6)}, {currentGPS.lng.toFixed(6)}
                        </div>
                    ) : (
                        <div className="animate-pulse text-red-500 text-sm">Searching GPS...</div>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold uppercase text-gray-400">Accuracy</div>
                    <div className={`text-lg font-bold ${currentGPS?.accuracy <= 5 ? 'text-green-600' : 'text-red-500'}`}>
                        {currentGPS ? `±${Math.round(currentGPS.accuracy)}m` : '-'}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Hole to Capture</label>
                <div className="flex flex-wrap gap-2 justify-center">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
                        <button
                            key={num}
                            onClick={() => setSelectedHole(num)}
                            className={`w-8 h-8 rounded text-sm font-bold border ${capturedHoles[num] ? 'bg-green-100 border-green-500 text-green-700' :
                                selectedHole === num ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleCapture}
                disabled={!currentGPS}
                className="w-full py-4 bg-blue-600 disabled:bg-gray-400 text-white rounded-xl font-bold shadow-lg mb-6 active:scale-95 transition"
            >
                📍 CAPTURE HOLE {selectedHole}
            </button>

            {status && (
                <p className="text-sm text-center mb-4">{status}</p>
            )}

            {Object.keys(capturedHoles).length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 text-left overflow-hidden">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400 font-bold uppercase">Ready to Hardcode</span>
                        <button onClick={() => navigator.clipboard.writeText(generateCode())} className="text-xs bg-white/20 hover:bg-white/40 text-white px-2 py-1 rounded">Copy</button>
                    </div>
                    <pre className="text-xs text-green-400 font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                        {generateCode()}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CalibrationView;
