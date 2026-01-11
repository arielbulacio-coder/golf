import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CalibrationView = () => {
    const { t } = useTranslation();
    const [currentGPS, setCurrentGPS] = useState(null);
    const [selectedHole, setSelectedHole] = useState(1);
    const [holes, setHoles] = useState([]);
    const [status, setStatus] = useState('');

    // Fetch holes from backend
    useEffect(() => {
        fetch('http://localhost:3001/api/holes')
            .then(res => res.json())
            .then(data => {
                if (data.data) setHoles(data.data);
            })
            .catch(err => {
                console.log("Backend not available, using local fallback or manual mode");
                setStatus("Mode: Local (Cannot sync to DB)");
            });
    }, []);

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

    const handleCalibrate = (type) => {
        if (!currentGPS) {
            alert("Waiting for GPS signal...");
            return;
        }

        const payload = {
            hole_number: selectedHole,
            type: type, // 'GREEN' or 'TEE'
            lat: currentGPS.lat,
            lng: currentGPS.lng,
            accuracy: currentGPS.accuracy
        };

        fetch('http://localhost:3001/api/calibrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                setStatus(`Saved ${type} for Hole ${selectedHole} successfully!`);
                // optionally refresh holes if needed
            })
            .catch(err => {
                console.error(err);
                setStatus("Error saving calibration. Is backend running?");
            });
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-xl max-w-md mx-auto border-4 border-red-500">
            <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Developer Calibration Device</h2>

            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-bold uppercase text-gray-500">Current GPS Signal</p>
                {currentGPS ? (
                    <div className="font-mono text-lg">
                        <div className="text-green-600">LAT: {currentGPS.lat.toFixed(6)}</div>
                        <div className="text-green-600">LNG: {currentGPS.lng.toFixed(6)}</div>
                        <div className="text-xs text-gray-500">Accuracy: {currentGPS.accuracy}m</div>
                    </div>
                ) : (
                    <div className="animate-pulse text-red-500">Searching satellites...</div>
                )}
            </div>

            <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Select Target Hole</label>
                <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
                        <button
                            key={num}
                            onClick={() => setSelectedHole(num)}
                            className={`p-2 rounded font-bold ${selectedHole === num ? 'bg-golf-deep text-white' : 'bg-gray-200'}`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
                <div className="mt-2 text-center font-bold text-xl">Hole {selectedHole}</div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <button
                    onClick={() => handleCalibrate('GREEN')}
                    className="bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition"
                >
                    🎯 Set GREEN Position
                    <span className="block text-xs font-normal opacity-80">Stand on the center of the green</span>
                </button>
            </div>

            {status && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded text-sm font-bold text-center">
                    {status}
                </div>
            )}
        </div>
    );
};

export default CalibrationView;
