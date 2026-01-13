import React, { useState } from 'react';

const clubs = [
    { name: 'Driver', maxDist: 260, accuracy: 0.6 },
    { name: '3 Wood', maxDist: 230, accuracy: 0.7 },
    { name: '5 Iron', maxDist: 180, accuracy: 0.8 },
    { name: '7 Iron', maxDist: 155, accuracy: 0.85 },
    { name: '9 Iron', maxDist: 135, accuracy: 0.9 },
    { name: 'PW', maxDist: 120, accuracy: 0.95 },
    { name: 'SW', maxDist: 90, accuracy: 0.95 }
];

const GolfSimulator = () => {
    const [selectedClub, setSelectedClub] = useState(clubs[0]);
    const [power, setPower] = useState(100);
    const [result, setResult] = useState(null);
    const [isSwinging, setIsSwinging] = useState(false);

    const handleSwing = () => {
        setIsSwinging(true);
        setResult(null);

        // Simulate swing delay
        setTimeout(() => {
            const powerFactor = power / 100;
            // Add randomness (+- 5%)
            const randomVar = 0.95 + (Math.random() * 0.1);

            const distance = Math.round(selectedClub.maxDist * powerFactor * randomVar);

            // Calculate accuracy
            // Harder swing = less accuracy
            const accuracyRoll = Math.random();
            const threshold = selectedClub.accuracy * (1.1 - (powerFactor * 0.2));

            let direction = "Recto al Centro 🎯";
            let color = "text-green-600";

            if (accuracyRoll > threshold) {
                // Determine miss
                const missType = Math.random() > 0.5 ? "Slice (Derecha) ↗️" : "Hook (Izquierda) ↖️";
                direction = missType; // Miss
                color = "text-orange-500";
                if (accuracyRoll > threshold + 0.15) {
                    direction = Math.random() > 0.5 ? "OOB Derecha ⚠️" : "OOB Izquierda ⚠️";
                    color = "text-red-600 font-bold";
                }
            }

            setResult({ distance, direction, color });
            setIsSwinging(false);
        }, 1000);
    };

    return (
        <div className="animate-fade-in-up pb-24 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-golf-deep mb-6 text-center">🏌️ Simulador de Tiro</h2>

            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                {/* Result Display */}
                <div className="bg-golf-light/30 rounded-lg h-48 flex flex-col items-center justify-center mb-6 relative overflow-hidden border border-golf-deep/10">
                    {isSwinging ? (
                        <div className="text-4xl animate-bounce">🏌️‍♂️💨</div>
                    ) : result ? (
                        <div className="text-center animate-fade-in-up">
                            <div className="text-6xl font-bold text-golf-deep mb-1">{result.distance}y</div>
                            <div className={`text-lg uppercase tracking-wide font-bold ${result.color}`}>{result.direction}</div>
                        </div>
                    ) : (
                        <div className="text-gray-400 text-sm">Prepara tu tiro...</div>
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Selecciona Palo</label>
                        <div className="grid grid-cols-4 gap-2">
                            {clubs.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => setSelectedClub(c)}
                                    className={`py-2 px-1 text-sm rounded-lg font-bold transition-all ${selectedClub.name === c.name ? 'bg-golf-deep text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Potencia del Swing: {power}%</label>
                        <input
                            type="range"
                            min="10"
                            max="110"
                            value={power}
                            onChange={(e) => setPower(e.target.value)}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-golf-deep"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Suave</span>
                            <span>Normal</span>
                            <span className="text-red-500 font-bold">¡Duro!</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSwing}
                        disabled={isSwinging}
                        className="w-full py-4 bg-elegant-gold text-golf-deep font-black text-xl rounded-full shadow-lg hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSwinging ? 'Calculando...' : '¡GOLPEAR!'}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                        * Simulación basada en estadísticas promedio.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GolfSimulator;
