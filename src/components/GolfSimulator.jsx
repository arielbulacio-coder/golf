import React, { useState, useRef, useEffect } from 'react';

const clubs = [
    { name: 'Driver', maxDist: 260, loft: 10, accuracy: 0.6, color: '#e74c3c' },
    { name: '3 Wood', maxDist: 230, loft: 15, accuracy: 0.7, color: '#e67e22' },
    { name: '5 Iron', maxDist: 180, loft: 27, accuracy: 0.8, color: '#f1c40f' },
    { name: '7 Iron', maxDist: 155, loft: 34, accuracy: 0.85, color: '#2ecc71' },
    { name: '9 Iron', maxDist: 135, loft: 42, accuracy: 0.9, color: '#1abc9c' },
    { name: 'PW', maxDist: 120, loft: 46, accuracy: 0.95, color: '#3498db' },
    { name: 'SW', maxDist: 90, loft: 56, accuracy: 0.95, color: '#9b59b6' }
];

const GolfSimulator = () => {
    const [selectedClub, setSelectedClub] = useState(clubs[0]);
    const [power, setPower] = useState(100);
    const [isSwinging, setIsSwinging] = useState(false);
    const [lastShot, setLastShot] = useState(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    // Physics constants
    const SCALE = 3; // pixels per yard (approx, depends on canvas width)

    useEffect(() => {
        drawScene(0, 0);
        return () => cancelAnimationFrame(animationRef.current);
    }, []);

    const drawScene = (ballX, ballY, trajectory = []) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Limpiar
        ctx.clearRect(0, 0, width, height);

        // Cielo
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Suelo (Césped)
        ctx.fillStyle = '#2d6a4f';
        ctx.fillRect(0, height - 40, width, 40);

        // Marcadores de distancia
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px Arial';
        for (let y = 50; y <= 300; y += 50) {
            const x = y * (width / 300) + 20; // Scale 0-300y to canvas width
            if (x < width) {
                ctx.beginPath();
                ctx.rect(x - 1, height - 40, 2, 5);
                ctx.fill();
                ctx.fillText(`${y}y`, x - 10, height - 25);
            }
        }

        // Tee
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(20, height - 45, 4, 5);

        // Trayectoria Previa (Ghost)
        if (trajectory.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.moveTo(22, height - 45);
            trajectory.forEach(point => {
                ctx.lineTo(22 + point.x, height - 45 - point.y);
            });
            ctx.stroke();
        }

        // Bola
        ctx.beginPath();
        ctx.fillStyle = 'white';
        // Ball position: startX + x, startY - y
        ctx.arc(22 + ballX, height - 45 - ballY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    };

    const handleSwing = () => {
        if (isSwinging) return;
        setIsSwinging(true);
        setLastShot(null);

        // Calcular tiro
        const powerFactor = power / 100;
        const randomVar = 0.95 + (Math.random() * 0.1);
        const totalDistanceYards = selectedClub.maxDist * powerFactor * randomVar;
        const loftRad = (selectedClub.loft * Math.PI) / 180;

        // Física simplificada para animación
        // Max height aprox depende del loft y fuerza.
        // H = (v0 * sin)^2 / 2g. 
        // Range R = v0^2 * sin(2theta) / g
        // Usaremos una parábola simple y = x * tan(theta) * (1 - x/R)
        // Scaled to fit canvas 

        let start = null;
        const duration = 2000; // ms
        const canvas = canvasRef.current;
        const width = canvas.width;

        // Mapear yardas a pixels del canvas (dejando 20px margen izq y der)
        const rangeInPixels = totalDistanceYards * (width / 300);
        const maxHeightPixels = rangeInPixels * Math.tan(loftRad) * 0.25; // Flattened a bit for view

        const currentTrajectory = [];

        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;

            if (progress < 1) {
                // Posición X lineal
                const currentX = rangeInPixels * progress;
                // Posición Y parabólica: 4 * H * p * (1-p)
                const currentY = 4 * maxHeightPixels * progress * (1 - progress);

                currentTrajectory.push({ x: currentX, y: currentY });
                drawScene(currentX, currentY, currentTrajectory);
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Fin
                drawScene(rangeInPixels, 0, currentTrajectory);
                setIsSwinging(false);

                // Determinar resultado texto
                let accuracyMsg = "Recto al Centro 🎯";
                let accColor = "text-green-600";

                // Simular desvío lateral solo para el texto (visualización es 2D lateral)
                const accuracyThreshold = selectedClub.accuracy * (1.1 - (powerFactor * 0.2));
                const roll = Math.random();

                if (roll > accuracyThreshold) {
                    const isRight = Math.random() > 0.5;
                    accuracyMsg = isRight ? "Slice (Desvío Der.) ↗️" : "Hook (Desvío Izq.) ↖️";
                    accColor = "text-orange-500";
                }

                setLastShot({
                    distance: Math.round(totalDistanceYards),
                    msg: accuracyMsg,
                    color: accColor
                });
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    return (
        <div className="animate-fade-in-up pb-24 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-golf-deep mb-4 text-center">🏌️ Simulador Virtual</h2>

            {/* Canvas Container */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6 border-4 border-golf-deep">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={300}
                    className="w-full h-auto bg-sky-200"
                />

                {/* Overlay Info */}
                <div className="bg-golf-deep text-white p-3 flex justify-between items-center">
                    <div>
                        <span className="text-xs uppercase opacity-70 block">Palo Seleccionado</span>
                        <span className="font-bold text-lg">{selectedClub.name}</span>
                    </div>
                    <div>
                        {lastShot ? (
                            <div className="text-right animate-pulse">
                                <div className="text-2xl font-bold text-yellow-400">{lastShot.distance} yds</div>
                                <div className="text-xs">{lastShot.msg}</div>
                            </div>
                        ) : (
                            <div className="text-right opacity-50 text-sm">
                                Esperando tiro...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-6 px-4">
                <div className="bg-white p-4 rounded-xl shadow">
                    <label className="block text-sm font-bold text-gray-700 mb-3">1. Elige tu Palo</label>
                    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                        {clubs.map((c) => (
                            <button
                                key={c.name}
                                onClick={() => setSelectedClub(c)}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all border-2 ${selectedClub.name === c.name ? 'border-golf-deep bg-golf-deep text-white shadow-lg' : 'border-gray-100 bg-gray-50 text-gray-600'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                        <span>2. Potencia</span>
                        <span className="text-golf-deep font-black">{power}%</span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="110"
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-golf-deep"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                        <span>Toque</span>
                        <span>Control</span>
                        <span className="text-red-500">¡Máxima!</span>
                    </div>
                </div>

                <button
                    onClick={handleSwing}
                    disabled={isSwinging}
                    className="w-full py-4 bg-gradient-to-r from-elegant-gold to-yellow-500 text-golf-deep font-black text-xl rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSwinging ? (
                        <>🚀 Volando...</>
                    ) : (
                        <>🏌️‍♂️ ¡GOLPEAR AHORA!</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default GolfSimulator;
