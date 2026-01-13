import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// --- Constants ---
const CLUBS = [
    { name: 'Driver', maxDist: 260, color: '#e74c3c' },
    { name: '3 Wood', maxDist: 230, color: '#e67e22' },
    { name: '5 Iron', maxDist: 180, color: '#f1c40f' },
    { name: '7 Iron', maxDist: 155, color: '#2ecc71' },
    { name: 'PW', maxDist: 125, color: '#3498db' },
    { name: 'SW', maxDist: 90, color: '#9b59b6' },
    { name: 'Putter', maxDist: 30, color: '#34495e' }
];

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

const GolfSimulator = () => {
    const { t } = useTranslation();
    const canvasRef = useRef(null);

    // Game State
    const [ballPos, setBallPos] = useState({ x: 200, y: 550 }); // Start at bottom center
    const [targetPos, setTargetPos] = useState({ x: 200, y: 100 });
    const [holeConfig, setHoleConfig] = useState(null);

    // Logic State
    const [gameMode, setGameMode] = useState('intro'); // intro, playing, putting, hole-out
    const [strokeCount, setStrokeCount] = useState(0);
    const [message, setMessage] = useState('');
    const [selectedClub, setSelectedClub] = useState(CLUBS[2]);
    const [power, setPower] = useState(80);

    // Animation Refs
    const ballAnimRef = useRef({ x: 200, y: 550 });
    const targetAnimRef = useRef({ x: 200, y: 550 }); // For animation target
    const isAnimating = useRef(false);

    useEffect(() => {
        generateHole();
    }, []);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && holeConfig) {
            drawScene(ctx);
        }
    }, [ballPos, holeConfig, gameMode]);

    const generateHole = () => {
        // Randomize Hole
        const distYards = Math.floor(Math.random() * 200) + 150;
        const par = distYards > 450 ? 5 : distYards > 250 ? 4 : 3;

        // Logical scale: 1 pixel = 1 yard roughly for simplicity, or scale to fit?
        // Let's Map: Bottom (550) is Tee. Top (50) is Green. 
        // Total screen height 500px = distYards.

        const generatedBunkers = [];
        for (let i = 0; i < 3; i++) {
            generatedBunkers.push({
                x: Math.random() * 300 + 50,
                y: Math.random() * 400 + 100,
                radius: Math.random() * 20 + 10
            });
        }

        setHoleConfig({
            par,
            dist: distYards,
            pixelsPerYard: 500 / distYards,
            bunkers: generatedBunkers,
            green: { x: 200, y: 50, radius: 40 }
        });

        // Reset
        setBallPos({ x: 200, y: 550 });
        ballAnimRef.current = { x: 200, y: 550 };
        setTargetPos({ x: 200, y: 50 }); // Logical target
        setStrokeCount(0);
        setGameMode('intro');
        setMessage(`Hoyo Par ${par} - ${distYards}y`);

        if (distYards > 220) setSelectedClub(CLUBS[0]);
        else setSelectedClub(CLUBS[3]);
    };

    // --- Drawing Engine (2D) ---
    const drawScene = (ctx) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const scale = holeConfig.pixelsPerYard;

        // 1. Draw Fairway (Simple Rectangle)
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. Draw Rough/Trees (Side strips)
        ctx.fillStyle = '#1e8449';
        ctx.fillRect(0, 0, 30, CANVAS_HEIGHT);
        ctx.fillRect(CANVAS_WIDTH - 30, 0, 30, CANVAS_HEIGHT);

        // 3. Draw Green
        ctx.beginPath();
        ctx.arc(holeConfig.green.x, holeConfig.green.y, holeConfig.green.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#82e0aa'; // Lighter green
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Draw Bunkers
        ctx.fillStyle = '#f5cba7'; // Sand
        holeConfig.bunkers.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke(); // border
        });

        // 5. Draw Hole/Flag
        ctx.beginPath();
        ctx.arc(holeConfig.green.x, holeConfig.green.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();

        // Flag Pole
        ctx.beginPath();
        ctx.moveTo(holeConfig.green.x, holeConfig.green.y);
        ctx.lineTo(holeConfig.green.x, holeConfig.green.y - 30);
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Flag
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(holeConfig.green.x, holeConfig.green.y - 30, 20, 15);

        // 6. Draw Ball
        // If animating, use anim ref, else state
        const b = isAnimating.current ? ballAnimRef.current : ballPos;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(b.x + 2, b.y + 2, 4, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // Ball body
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 7. Aim Line (only if playing)
        if (gameMode === 'playing' && !isAnimating.current) {
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(holeConfig.green.x, holeConfig.green.y);
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
        }
    };

    // --- Game Logic ---

    const animateShot = (targetX, targetY, onComplete) => {
        isAnimating.current = true;
        const startX = ballAnimRef.current.x;
        const startY = ballAnimRef.current.y;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Math.min(dist * 2, 2000); // ms
        const startTime = performance.now();

        const loop = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing (easeOutQuad)
            const ease = 1 - (1 - progress) * (1 - progress);

            const curX = startX + dx * ease;
            const curY = startY + dy * ease;

            ballAnimRef.current = { x: curX, y: curY };

            // Draw frame
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) drawScene(ctx);

            if (progress < 1) {
                requestAnimationFrame(loop);
            } else {
                isAnimating.current = false;
                setBallPos({ x: targetX, y: targetY });
                onComplete();
            }
        };
        requestAnimationFrame(loop);
    };

    const handleShot = () => {
        if (!holeConfig || isAnimating.current) return;

        // Calculate Distance
        const shotPower = power / 100;
        const clubDistYards = selectedClub.maxDist * shotPower;
        const pixelsToTravel = clubDistYards * holeConfig.pixelsPerYard;

        // Direction? Assume aiming at center line roughly, with noise
        // Simple 2D: Just move towards top (y=0) minus noise x

        // Better: Vector from ball to hole
        const dx = holeConfig.green.x - ballPos.x;
        const dy = holeConfig.green.y - ballPos.y;
        const distToHolePixels = Math.sqrt(dx * dx + dy * dy);

        // Normalized Dir
        const uX = dx / distToHolePixels;
        const uY = dy / distToHolePixels;

        // Add randomness/Accuracy
        const accuracyNoise = (Math.random() - 0.5) * 0.2; // Radians jitter
        const angle = Math.atan2(uY, uX) + accuracyNoise;

        const finalX = ballPos.x + Math.cos(angle) * pixelsToTravel;
        const finalY = ballPos.y + Math.sin(angle) * pixelsToTravel;

        setStrokeCount(s => s + 1);
        setMessage("¡Buen tiro!");

        animateShot(finalX, finalY, () => {
            // Check result
            checkLie(finalX, finalY);
        });
    };

    const checkLie = (x, y) => {
        // Distance to hole
        const dx = x - holeConfig.green.x;
        const dy = y - holeConfig.green.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distYards = distPx / holeConfig.pixelsPerYard;

        // Check Bunkers
        let inBunker = false;
        holeConfig.bunkers.forEach(b => {
            const bx = x - b.x;
            const by = y - b.y;
            if (Math.sqrt(bx * bx + by * by) < b.radius) inBunker = true;
        });

        if (distYards < 1) { // 1 yard tolerance
            endHole();
        } else if (distYards < 20) {
            setGameMode('putting');
            setSelectedClub(CLUBS[6]); // Putter
            setMessage(`En Green - ${distYards.toFixed(1)}y`);
        } else if (inBunker) {
            setMessage("¡En el Bunker! Usa el SW.");
            setSelectedClub(CLUBS[5]);
        } else {
            setGameMode('playing');
            setMessage(`${distYards.toFixed(0)}y al hoyo`);
            // Auto club
            const best = CLUBS.find(c => c.maxDist >= distYards) || CLUBS[0];
            setSelectedClub(best);
        }
    };

    const endHole = () => {
        setGameMode('hole-out');
        const diff = (strokeCount + 1) - holeConfig.par;
        let txt = "PAR";
        if (diff === -1) txt = "BIRDIE";
        if (diff === -2) txt = "EAGLE";
        if (diff === 1) txt = "BOGEY";
        if (strokeCount + 1 === 1) txt = "HOYO EN UNO";

        setMessage(`¡${txt}! Total: ${strokeCount + 1}`);
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gray-900 text-white font-sans pb-safe">
            {/* Header */}
            <div className="p-4 bg-gray-800 flex justify-between items-center shadow-lg z-10">
                <div>
                    <h1 className="text-xl font-bold text-white italic">Caddy 2D</h1>
                    <p className="text-xs text-yellow-400 font-bold">{message}</p>
                </div>
                <div className="text-right">
                    <div className="text-xs uppercase opacity-70">Golpes</div>
                    <div className="text-3xl font-black">{strokeCount}</div>
                </div>
            </div>

            {/* Viewport */}
            <div className="flex-grow relative overflow-hidden bg-golf-green flex justify-center items-center">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-full object-contain max-w-lg shadow-2xl bg-[#27ae60]"
                />

                {gameMode === 'intro' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-8 backdrop-blur-sm">
                        <div className="bg-white text-black p-6 rounded-2xl text-center shadow-2xl w-full max-w-xs animate-scale-in">
                            <h2 className="text-2xl font-black text-golf-deep mb-2">Hoyo #{Math.floor(Math.random() * 18 + 1)}</h2>
                            <p className="text-xl mb-4 font-bold">Par {holeConfig?.par} - {holeConfig?.dist}y</p>
                            <button onClick={() => setGameMode('playing')} className="w-full bg-elegant-gold py-3 rounded-xl font-black uppercase shadow-lg transform active:scale-95 transition">
                                Jugar Hoyo 🏌️‍♂️
                            </button>
                        </div>
                    </div>
                )}

                {gameMode === 'hole-out' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-8 z-20">
                        <div className="bg-white text-black p-6 rounded-2xl text-center shadow-2xl w-full max-w-xs animate-scale-in">
                            <div className="text-5xl mb-2">⛳</div>
                            <h2 className="text-2xl font-black mb-2">{message}</h2>
                            <button onClick={generateHole} className="w-full bg-golf-deep text-white py-3 rounded-xl font-black uppercase shadow-lg mt-4">
                                Siguiente Hoyo ➡️
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-white text-gray-800 p-4 pb-8 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.2)] z-10">
                <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
                    {CLUBS.map(c => (
                        <button
                            key={c.name}
                            onClick={() => setSelectedClub(c)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition ${selectedClub.name === c.name ? 'bg-golf-deep text-white border-golf-deep shadow-lg transform scale-105' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold uppercase mb-1">
                        <span>Potencia</span>
                        <span className="text-golf-deep">{power}%</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        className="w-full h-4 bg-gray-200 rounded-full appearance-none accent-golf-deep cursor-pointer"
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={generateHole} className="p-4 rounded-xl bg-gray-200 text-gray-500 font-bold">
                        🔄
                    </button>
                    <button
                        onClick={handleShot}
                        disabled={gameMode !== 'playing' && gameMode !== 'putting'}
                        className={`flex-1 py-4 rounded-xl font-black text-xl text-white shadow-lg transition transform active:scale-95 ${gameMode === 'putting' ? 'bg-green-600' : 'bg-gradient-to-r from-elegant-gold to-yellow-600'}`}
                    >
                        {gameMode === 'putting' ? "⛳ PUTT" : "💥 GOLPEAR"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GolfSimulator;
