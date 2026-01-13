import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// --- Constants & Config ---
const CLUBS = [
    { name: 'Driver', maxDist: 260, color: '#e74c3c' },
    { name: '3 Wood', maxDist: 230, color: '#d35400' },
    { name: '5 Iron', maxDist: 180, color: '#f1c40f' },
    { name: '7 Iron', maxDist: 155, color: '#2ecc71' },
    { name: 'PW', maxDist: 125, color: '#3498db' },
    { name: 'SW', maxDist: 90, color: '#9b59b6' },
    { name: 'Putter', maxDist: 30, color: '#34495e' }
];

const CANVAS_WIDTH = 400; // Intrinsic width
const CANVAS_HEIGHT = 600;

// Colors for "Premium" look
const COLORS = {
    fairway: '#2ea043',
    fairwayDark: '#238636',
    rough: '#1a5225',
    sand: '#f0d9b5',
    sandShadow: '#d6bfa0',
    hole: '#1b1f23',
    greenLight: '#6fcf97',
    greenDark: '#27ae60'
};

const GolfSimulator = () => {
    const { t } = useTranslation();
    const canvasRef = useRef(null);

    // --- State ---
    const [ballPos, setBallPos] = useState({ x: 200, y: 550 });
    const [holeConfig, setHoleConfig] = useState(null);
    const [gameMode, setGameMode] = useState('intro'); // intro, playing, putting, hole-out
    const [strokeCount, setStrokeCount] = useState(0);
    const [message, setMessage] = useState('');
    const [selectedClub, setSelectedClub] = useState(CLUBS[2]);
    const [power, setPower] = useState(80);

    // Animation & View Refs
    const ballAnimRef = useRef({ x: 200, y: 550 });
    const isAnimating = useRef(false);
    const viewTransform = useRef({ scale: 1, x: 0, y: 0 }); // Current view transform

    useEffect(() => {
        generateHole();
    }, []);

    // Render Loop
    useEffect(() => {
        let animationFrameId;

        const render = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && holeConfig) {
                // Determine target view based on mode
                let targetScale = 1;
                let targetX = 0;
                let targetY = 0;

                if (gameMode === 'putting' || gameMode === 'hole-out') {
                    // Zoom into Green
                    targetScale = 3;
                    // Center green in view
                    // We want: holeConfig.green.x * scale + transX = 200 (Center Screen)
                    targetX = (CANVAS_WIDTH / 2) - (holeConfig.green.x * targetScale);
                    targetY = (CANVAS_HEIGHT / 2) - (holeConfig.green.y * targetScale);
                } else if (gameMode === 'playing') {
                    // Zoom slightly if ball is close? No, full view usually better unless aiming
                    // Maybe dynamic pan to ball? For now keep standard full view
                    targetScale = 1;
                    targetX = 0;
                    targetY = 0;
                }

                // Initial Intro Zoom
                if (gameMode === 'intro') {
                    targetScale = 0.8;
                    targetX = CANVAS_WIDTH * 0.1;
                }

                // Smooth Camera Pan/Zoom (Lerp)
                viewTransform.current.scale += (targetScale - viewTransform.current.scale) * 0.05;
                viewTransform.current.x += (targetX - viewTransform.current.x) * 0.05;
                viewTransform.current.y += (targetY - viewTransform.current.y) * 0.05;

                drawScene(ctx);
            }
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [ballPos, holeConfig, gameMode]);

    const generateHole = () => {
        const distYards = Math.floor(Math.random() * 200) + 150;
        const par = distYards > 450 ? 5 : distYards > 280 ? 4 : 3;

        const generatedBunkers = [];
        for (let i = 0; i < 3; i++) {
            generatedBunkers.push({
                x: Math.random() * 240 + 80, // More center aligned
                y: Math.random() * 350 + 100,
                radius: Math.random() * 15 + 10,
                shape: Math.random() // for variety if implemented
            });
        }

        setHoleConfig({
            par,
            dist: distYards,
            pixelsPerYard: 500 / distYards,
            bunkers: generatedBunkers,
            green: { x: 200, y: 50, radius: 45 } // Larger green for aesthetics
        });

        // Reset
        setBallPos({ x: 200, y: 550 });
        ballAnimRef.current = { x: 200, y: 550 };
        setStrokeCount(0);
        setGameMode('intro');
        setMessage(`Hoyo Par ${par} - ${distYards}y`);

        if (distYards > 220) setSelectedClub(CLUBS[0]);
        else setSelectedClub(CLUBS[3]);
    };

    // --- Drawing Logic ---

    const drawScene = (ctx) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.save();

        // Apply Camera Transform
        ctx.translate(viewTransform.current.x, viewTransform.current.y);
        ctx.scale(viewTransform.current.scale, viewTransform.current.scale);

        // -- Base Grass --
        // Use pattern or simply rect
        ctx.fillStyle = COLORS.rough;
        ctx.fillRect(-100, -100, CANVAS_WIDTH + 200, CANVAS_HEIGHT + 200); // Overdraw for zoom

        // -- Fairway --
        // Draw a curvy path? Simplest is Rect for compatibility, but let's do a curved "Course"
        ctx.beginPath();
        ctx.moveTo(100, 600);
        ctx.bezierCurveTo(50, 400, 50, 200, 150, 50); // Left edge curve
        ctx.lineTo(250, 50);
        ctx.bezierCurveTo(350, 200, 350, 400, 300, 600); // Right edge curve
        ctx.fill(); // Rough background fill?

        // Actually, create clipping region for fairway texture?
        // Let's just draw distinct areas.

        // Fairway Main Body
        const fwGrad = ctx.createLinearGradient(0, 600, 0, 0);
        fwGrad.addColorStop(0, COLORS.fairway);
        fwGrad.addColorStop(1, COLORS.fairwayDark);
        ctx.fillStyle = fwGrad;
        ctx.fill();

        // -- Green --
        const gCenter = holeConfig.green;
        const gRad = ctx.createRadialGradient(gCenter.x - 10, gCenter.y - 10, 5, gCenter.x, gCenter.y, gCenter.radius);
        gRad.addColorStop(0, '#88e0b0'); // Highlight
        gRad.addColorStop(1, COLORS.greenDark);

        ctx.beginPath();
        ctx.arc(gCenter.x, gCenter.y, gCenter.radius, 0, Math.PI * 2);
        ctx.fillStyle = gRad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // -- Bunkers --
        holeConfig.bunkers.forEach(b => {
            ctx.beginPath();
            // Wobbly circles for realism? simple circle for compat
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.sand;
            ctx.fill();
            // Inner shadow simulated with stroke or inner gradient
            ctx.strokeStyle = COLORS.sandShadow;
            ctx.lineWidth = 3;
            ctx.stroke();
        });

        // -- Hole --
        ctx.beginPath();
        ctx.arc(gCenter.x, gCenter.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.hole;
        ctx.fill();

        // -- Flag -- (If not putting or zoomed out)
        if (gameMode !== 'putting') {
            // Shadow
            ctx.beginPath();
            ctx.ellipse(gCenter.x + 10, gCenter.y + 10, 8, 3, 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fill();

            // Pole
            ctx.beginPath();
            ctx.moveTo(gCenter.x, gCenter.y);
            ctx.lineTo(gCenter.x + 2, gCenter.y - 60); // Tilted perspective
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#fff';
            ctx.stroke();

            // Cloth
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.moveTo(gCenter.x + 2, gCenter.y - 60);
            ctx.lineTo(gCenter.x + 30, gCenter.y - 50);
            ctx.lineTo(gCenter.x + 2, gCenter.y - 40);
            ctx.fill();
        }

        // -- Ball --
        const b = isAnimating.current ? ballAnimRef.current : ballPos;

        // Ball Shadow
        ctx.beginPath();
        ctx.ellipse(b.x + 3, b.y + 3, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // Ball Body
        const ballGrad = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, 6);
        ballGrad.addColorStop(0, '#fff');
        ballGrad.addColorStop(1, '#bdc3c7');

        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); // Slightly bigger ball for visibility
        ctx.fillStyle = ballGrad;
        ctx.fill();

        // Aim Line
        if ((gameMode === 'playing' || gameMode === 'putting') && !isAnimating.current) {
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(holeConfig.green.x, holeConfig.green.y);
            ctx.setLineDash([8, 6]);
            ctx.strokeStyle = gameMode === 'putting' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    };


    // --- Game Logic ---

    const animateShot = (targetX, targetY, onComplete) => {
        isAnimating.current = true;
        const startX = ballAnimRef.current.x;
        const startY = ballAnimRef.current.y;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Math.min(dist * 2.5, 2500);
        const startTime = performance.now();

        const loop = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease Out Quad
            const ease = 1 - (1 - progress) * (1 - progress);

            // Adding "height" arc simply by scale? No, 2d pos is enough
            const curX = startX + dx * ease;
            const curY = startY + dy * ease;

            ballAnimRef.current = { x: curX, y: curY };

            if (progress < 1) {
                requestAnimationFrame(loop);
            } else {
                isAnimating.current = false;
                setBallPos({ x: targetX, y: targetY }); // Sync state
                onComplete();
            }
        };
        requestAnimationFrame(loop);
    };

    const handleShot = () => {
        if (!holeConfig || isAnimating.current) return;

        const shotPower = power / 100;
        const clubDistYards = selectedClub.maxDist * shotPower;
        const pixelsToTravel = clubDistYards * holeConfig.pixelsPerYard;

        const dx = holeConfig.green.x - ballPos.x;
        const dy = holeConfig.green.y - ballPos.y;
        const distToHolePixels = Math.sqrt(dx * dx + dy * dy);

        const uX = dx / distToHolePixels;
        const uY = dy / distToHolePixels;

        // Accuracy Noise
        const accuracyNoise = (Math.random() - 0.5) * (gameMode === 'putting' ? 0.1 : 0.25);
        const angle = Math.atan2(uY, uX) + accuracyNoise;

        const finalX = ballPos.x + Math.cos(angle) * pixelsToTravel;
        const finalY = ballPos.y + Math.sin(angle) * pixelsToTravel;

        setStrokeCount(s => s + 1);
        setMessage(gameMode === 'putting' ? "Rodando..." : "¡En el aire!");

        animateShot(finalX, finalY, () => {
            checkLie(finalX, finalY);
        });
    };

    const checkLie = (x, y) => {
        // Distance to hole in yards
        const dx = x - holeConfig.green.x;
        const dy = y - holeConfig.green.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distYards = distPx / holeConfig.pixelsPerYard;

        // Bunkers
        let inBunker = false;
        holeConfig.bunkers.forEach(b => {
            const bx = x - b.x;
            const by = y - b.y;
            if (Math.sqrt(bx * bx + by * by) < b.radius) inBunker = true;
        });

        if (distYards < 1) {
            endHole();
        } else if (distYards < 20) {
            setGameMode('putting');
            setSelectedClub(CLUBS[6]);
            setMessage(`Green - ${distYards.toFixed(1)}y - Zoom Activo`);
        } else if (inBunker) {
            setMessage("¡Bunker! Penalizado.");
            setSelectedClub(CLUBS[5]);
        } else {
            setGameMode('playing');
            setMessage(`${distYards.toFixed(0)}y al hoyo`);
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
        if (diff >= 2) txt = "DOBLE BOGEY";
        if (strokeCount + 1 === 1) txt = "HOYO EN UNO";

        setMessage(`¡${txt}! Total: ${strokeCount + 1}`);
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gray-900 text-white font-sans pb-safe">
            {/* Header */}
            <div className="p-4 bg-gray-800 flex justify-between items-center shadow-lg z-10">
                <div>
                    <h1 className="text-xl font-bold text-white italic">Caddy <span className="text-golf-accent">PRO</span></h1>
                    <p className="text-xs text-yellow-400 font-bold">{message}</p>
                </div>
                <div className="text-right">
                    <div className="text-xs uppercase opacity-70">Golpes</div>
                    <div className="text-3xl font-black">{strokeCount}</div>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-grow relative overflow-hidden bg-black flex justify-center items-center">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-full object-contain max-w-lg shadow-2xl bg-[#1e8449]"
                />

                {/* Intro Overlay */}
                {gameMode === 'intro' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-8 backdrop-blur-sm z-20">
                        <div className="bg-white text-black p-6 rounded-3xl text-center shadow-2xl w-full max-w-xs animate-fade-in-up border-4 border-golf-accent">
                            <h2 className="text-3xl font-black text-golf-deep mb-2">HOYO {Math.floor(Math.random() * 18 + 1)}</h2>
                            <div className="flex justify-center gap-4 text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
                                <span>Par {holeConfig?.par}</span>
                                <span>•</span>
                                <span>{holeConfig?.dist}y</span>
                            </div>
                            <button onClick={() => setGameMode('playing')} className="w-full bg-golf-deep text-white py-4 rounded-xl font-black uppercase shadow-lg transform active:scale-95 transition hover:bg-black">
                                Jugar 🏌️‍♂️
                            </button>
                        </div>
                    </div>
                )}

                {/* Hole Out Overlay */}
                {gameMode === 'hole-out' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-8 z-20">
                        <div className="bg-white text-black p-6 rounded-3xl text-center shadow-2xl w-full max-w-xs animate-scale-in">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-3xl font-black mb-2 text-golf-deep">{message.split('!')[0]}!</h2>
                            <p className="font-bold text-gray-500">Golpes Totales: {strokeCount + 1}</p>
                            <button onClick={generateHole} className="w-full bg-elegant-gold text-golf-deep py-4 rounded-xl font-black uppercase shadow-lg mt-6 hover:brightness-110">
                                Siguiente Hoyo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-white text-gray-800 p-4 pb-8 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-10 border-t border-gray-100">
                <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
                    {CLUBS.map(c => (
                        <button
                            key={c.name}
                            onClick={() => setSelectedClub(c)}
                            className={`px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all ${selectedClub.name === c.name ? 'border-golf-deep bg-golf-deep text-white shadow-md scale-105' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                <div className="mb-6 px-2">
                    <div className="flex justify-between text-xs font-bold uppercase mb-2 tracking-wider text-gray-400">
                        <span>Potencia</span>
                        <span className="text-golf-deep font-black">{power}%</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        className="w-full h-3 bg-gray-200 rounded-full appearance-none accent-golf-deep cursor-pointer hover:accent-golf-accent"
                    />
                </div>

                <div className="flex gap-4">
                    <button onClick={generateHole} className="p-4 rounded-2xl bg-gray-100 text-gray-400 font-bold hover:bg-gray-200 transition">
                        🔄
                    </button>
                    <button
                        onClick={handleShot}
                        disabled={isAnimating.current || (gameMode !== 'playing' && gameMode !== 'putting')}
                        className={`flex-1 py-4 rounded-2xl font-black text-xl text-white shadow-xl transition transform active:scale-95 ${gameMode === 'putting' ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-golf-deep to-black hover:to-gray-800'}`}
                    >
                        {isAnimating.current ? "..." : (gameMode === 'putting' ? "PUTT AL HOYO" : "GOLPEAR")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GolfSimulator;
