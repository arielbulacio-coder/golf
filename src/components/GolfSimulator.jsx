import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [selectedClub, setSelectedClub] = useState(clubs[3]); // Default 7 Iron
    const [power, setPower] = useState(80);
    const [isSwinging, setIsSwinging] = useState(false);
    const [lastShot, setLastShot] = useState(null);

    // Game State
    const [targetDist, setTargetDist] = useState(150);
    const [score, setScore] = useState(0);
    const [shotsLeft, setShotsLeft] = useState(5);
    const [gameState, setGameState] = useState('playing'); // playing, gameOver

    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    // Physics constants
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 300;
    const MAX_YARDS = 300;

    useEffect(() => {
        startNewGame();
        return () => cancelAnimationFrame(animationRef.current);
    }, []);

    // Effect to redraw when target changes (e.g. new level/shot setup)
    useEffect(() => {
        if (!isSwinging) drawScene(0, 0);
    }, [targetDist]);

    const startNewGame = () => {
        setScore(0);
        setShotsLeft(5);
        setGameState('playing');
        setTargetDist(Math.floor(Math.random() * 200) + 50); // Random target 50-250y
        setLastShot(null);
        setPower(80);
    };

    const nextHole = () => {
        setTargetDist(Math.floor(Math.random() * 200) + 50);
        setLastShot(null);
    };

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

        // Target Flag 🚩
        const targetPixelX = (targetDist / MAX_YARDS) * width + 20;
        // Pole
        ctx.fillStyle = '#C0392B'; // Dark Red (contrast) or Black
        ctx.fillRect(targetPixelX, height - 100, 2, 60);
        // Flag
        ctx.fillStyle = '#E74C3C'; // Red
        ctx.beginPath();
        ctx.moveTo(targetPixelX, height - 100);
        ctx.lineTo(targetPixelX + 20, height - 90);
        ctx.lineTo(targetPixelX, height - 80);
        ctx.fill();
        // Hole circle
        ctx.fillStyle = '#1e4835'; // Darker grass
        ctx.beginPath();
        ctx.ellipse(targetPixelX, height - 40, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Target Text
        ctx.fillStyle = '#C0392B';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${targetDist}y`, targetPixelX - 10, height - 110);


        // Marcadores de distancia (más sutiles)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px Arial';
        for (let y = 50; y <= MAX_YARDS; y += 50) {
            const x = (y / MAX_YARDS) * width + 20;
            if (x < width) {
                ctx.fillRect(x - 1, height - 40, 2, 5);
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
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 4;
        ctx.arc(22 + ballX, height - 45 - ballY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    };

    const handleSwing = () => {
        if (isSwinging || shotsLeft <= 0) return;
        setIsSwinging(true);
        setLastShot(null);

        // Calcular tiro
        const powerFactor = power / 100;
        const randomVar = 0.95 + (Math.random() * 0.1); // +/- 5% variance
        const totalDistanceYards = selectedClub.maxDist * powerFactor * randomVar;
        const loftRad = (selectedClub.loft * Math.PI) / 180;

        let start = null;
        const duration = 2000; // ms
        const canvas = canvasRef.current;
        const width = canvas.width;

        // Mapear yardas a pixels del canvas
        // We use MAX_YARDS - margin
        const usableWidth = width;
        const pixelsPerYard = usableWidth / MAX_YARDS;
        const rangeInPixels = totalDistanceYards * pixelsPerYard;
        const maxHeightPixels = rangeInPixels * Math.tan(loftRad) * 0.3; // Visual scale

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
                // Fin Animación
                drawScene(rangeInPixels, 0, currentTrajectory);
                setIsSwinging(false);

                // Calculate Results
                const diff = Math.abs(totalDistanceYards - targetDist);
                let points = 0;
                let msg = "";
                let color = "";

                if (diff < 5) {
                    points = 1000;
                    msg = "¡HOYO EN UNO! 🦅 (o casi)";
                    color = "text-purple-600";
                } else if (diff < 15) {
                    points = 500;
                    msg = "¡Excelente Tiro! 🎯";
                    color = "text-green-600";
                } else if (diff < 30) {
                    points = 200;
                    msg = "buen tiro 👍";
                    color = "text-blue-600";
                } else {
                    points = 10;
                    msg = "Sigue practicando...";
                    color = "text-gray-500";
                }

                setScore(prev => prev + points);
                setShotsLeft(prev => {
                    const next = prev - 1;
                    if (next === 0) setGameState('gameOver');
                    return next;
                });

                setLastShot({
                    distance: Math.round(totalDistanceYards),
                    diff: Math.round(diff),
                    msg,
                    color,
                    points
                });
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    return (
        <div className="animate-fade-in-up pb-24 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-golf-deep mb-2 text-center">🎯 Desafío de Precisión</h2>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md mb-4 border border-gray-100">
                <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase font-bold">Objetivo</p>
                    <p className="text-2xl font-black text-red-500">{targetDist}y</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase font-bold">Puntaje</p>
                    <p className="text-3xl font-black text-golf-deep">{score}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase font-bold">Tiros Restantes</p>
                    <p className="text-2xl font-black text-gray-700">{shotsLeft}</p>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6 border-4 border-golf-deep relative">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={300}
                    className="w-full h-auto bg-sky-200"
                />
                {gameState === 'gameOver' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                        <h3 className="text-4xl font-bold mb-2">¡Juego Terminado!</h3>
                        <p className="text-2xl mb-6">Puntaje Final: <span className="text-yellow-400 font-black">{score}</span></p>
                        <button
                            onClick={startNewGame}
                            className="bg-elegant-gold text-golf-deep px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition"
                        >
                            🔄 Jugar de Nuevo
                        </button>
                    </div>
                )}
            </div>

            {/* Info Last Shot */}
            <div className="h-16 mb-4 flex items-center justify-center">
                {lastShot && (
                    <div className={`text-center animate-bounce-short ${lastShot.color}`}>
                        <div className="text-xl font-bold">{lastShot.msg} (+{lastShot.points})</div>
                        <div className="text-sm">Distancia: {lastShot.distance}y (a {lastShot.diff}y del hoyo)</div>
                    </div>
                )}
                {!lastShot && !isSwinging && gameState !== 'gameOver' && <p className="text-gray-400 italic">Prepara tu tiro...</p>}
            </div>

            {/* Controls */}
            {gameState !== 'gameOver' && (
                <div className="space-y-6 px-4">
                    <div className="bg-white p-4 rounded-xl shadow">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-gray-700">1. Palo</label>
                            <button onClick={nextHole} className="text-xs text-blue-500 underline">Cambiar Objetivo</button>
                        </div>

                        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                            {clubs.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => setSelectedClub(c)}
                                    className={`flex-shrink-0 px-4 py-3 rounded-xl font-bold text-sm transition-all border-b-4 ${selectedClub.name === c.name ? 'border-golf-dark bg-golf-deep text-white shadow-lg translate-y-px' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                >
                                    {c.name}
                                    <div className="text-[10px] font-normal opacity-80">{c.maxDist}y</div>
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
                            className="w-full h-6 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-golf-deep"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                            <span>Suave</span>
                            <span>Normal</span>
                            <span className="text-red-500">Power 🔥</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSwing}
                        disabled={isSwinging}
                        className="w-full py-4 bg-gradient-to-r from-elegant-gold to-yellow-500 text-golf-deep font-black text-xl rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-8"
                    >
                        {isSwinging ? (
                            <>🚀 Volando...</>
                        ) : (
                            <>🏌️‍♂️ ¡GOLPEAR!</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GolfSimulator;
