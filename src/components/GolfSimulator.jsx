import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Text, useTexture, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';

// --- Constants & Data ---
const CLUBS = [
    { name: 'Driver', maxDist: 260, loft: 10.5, color: '#e74c3c' },
    { name: '5 Iron', maxDist: 180, loft: 27, color: '#f1c40f' },
    { name: '7 Iron', maxDist: 155, loft: 34, color: '#2ecc71' },
    { name: 'SW', maxDist: 90, loft: 56, color: '#9b59b6' },
    { name: 'Putter', maxDist: 30, loft: 0, color: '#34495e' }
];

// --- 3D Components ---

function Ball({ position }) {
    return (
        <mesh position={position} castShadow receiveShadow>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial color="white" roughness={0.4} metalness={0.1} />
        </mesh>
    );
}

function Flag({ position }) {
    return (
        <group position={position}>
            {/* Hole */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[0.5, 32]} />
                <meshStandardMaterial color="#2d3436" />
            </mesh>
            {/* Pole */}
            <mesh position={[0, 2.5, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 5, 12]} />
                <meshStandardMaterial color="#bdc3c7" metalness={0.5} roughness={0.1} />
            </mesh>
            {/* Flag */}
            <mesh position={[0, 4.25, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
                <boxGeometry args={[0.1, 1.5, 2]} />
                <meshStandardMaterial color="#e74c3c" />
            </mesh>
        </group>
    );
}

function Terrain() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial color="#27ae60" roughness={1} />
        </mesh>
    );
}

function GameCamera({ ballPos, targetPos, mode }) {
    const { camera } = useThree();
    const targetVec = new THREE.Vector3(...targetPos);

    useFrame(() => {
        if (mode === 'putting') {
            // Green View: High angle from front/side looking at hole and ball
            // Target is hole. Camera is "in front" of hole looking back at ball? 
            // User asked: "Al llegar al green se vea de frente desde una cierta altura"
            // Let's position camera behind the hole, looking at the ball, or side.
            // Typically Putting view is behind ball looking at hole. 
            // But "de frente" usually means looking at the player/ball face on?
            // Let's interpret "de frente" as looking at the green structure.
            // Let's do a "TV Tower" view: High up, side/front.

            const camPos = new THREE.Vector3(targetVec.x + 10, 10, targetVec.z + 10);
            camera.position.lerp(camPos, 0.05);
            camera.lookAt(targetVec.x, 0, targetVec.z);
        } else if (mode === 'flying') {
            // Follow ball? Or stay at tee? 
            // Simple: Stay at tee, look at ball. Or follow ball.
            // Let's follow ball slightly behind and above.
            const offset = new THREE.Vector3(0, 5, -10);
            const desiredPos = new THREE.Vector3(ballPos[0], ballPos[1], ballPos[2]).add(offset);
            // We don't want to move camera violently. 
            // Ideally keep camera at startPos but look at ball?
            // For simple simulator, static camera behind tee is often best to see trajectory.
        } else {
            // Tee / Default View: Behind ball
            const startPos = new THREE.Vector3(ballPos[0], ballPos[1] + 2, ballPos[2] - 5);
            // Assuming shot goes towards +Z or something. 
            // Actually we are shooting from 0 towards +Z? 
            // Let's say Start is (0,0,0) and Target is (0,0, 150).
            // Camera should be at (0, 2, -5) looking at (0,2,10).

            // If we are far, we move camera to ball.
            camera.position.lerp(new THREE.Vector3(ballPos[0], 5, ballPos[2] - 10), 0.1);
            camera.lookAt(targetVec.x, 0, targetVec.z);
        }
    });
    return null;
}


// --- Main Simulator Component ---

const GolfSimulator = () => {
    const { t } = useTranslation();

    // Game State
    const [ballPos, setBallPos] = useState([0, 0.3, 0]); // x, y, z
    const [targetPos, setTargetPos] = useState([0, 0, 150]); // 150 yards away
    const [score, setScore] = useState(0);
    const [shotsLeft, setShotsLeft] = useState(5);
    const [gameMode, setGameMode] = useState('tee'); // tee, flying, putting, landed
    const [message, setMessage] = useState("¡Bienvenido! Haz tu tiro.");

    // Shot Params
    const [selectedClub, setSelectedClub] = useState(CLUBS[2]); // 7 Iron
    const [power, setPower] = useState(80);

    // Physics Refs
    const ballRef = useRef(new THREE.Vector3(0, 0.3, 0));
    const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
    const gravity = 9.8;
    const isSimulatingRef = useRef(false);

    // Setup New Game
    useEffect(() => {
        resetHole();
    }, []);

    const resetHole = () => {
        setBallPos([0, 0.3, 0]);
        ballRef.current.set(0, 0.3, 0);
        // Random target z: 50 to 250
        const dist = Math.floor(Math.random() * 200) + 50;
        setTargetPos([0, 0, dist]);
        setGameMode('tee');
        setMessage(`Objetivo: ${dist} yardas.`);

        // Auto Select Driver if long, Iron if med
        if (dist > 200) setSelectedClub(CLUBS[0]);
        else if (dist > 150) setSelectedClub(CLUBS[1]);
        else setSelectedClub(CLUBS[2]);
    };

    const handleSwing = () => {
        if (isSimulatingRef.current || shotsLeft <= 0) return;

        // 1. Calculate trajectory Physics
        // Convert power to velocity. 
        // Club max dist (yards) -> roughly corresponds to initial velocity.
        // R = v^2 * sin(2theta) / g
        // v = sqrt(R * g / sin(2theta))
        // We assume yard = meter for simplicity in 3D scale (Threejs unit = 1 meter/yard)

        const dist = selectedClub.maxDist * (power / 100);
        const loftBox = (selectedClub.loft * Math.PI) / 180;

        // Slight randomness
        const accuracy = 0.95 + Math.random() * 0.1;
        const finalDist = dist * accuracy;

        // Lateral error (slice/hook)
        const lateralErr = (Math.random() - 0.5) * (finalDist * 0.1);

        // Initial speed V0 needed to reach finalDist
        // v0 = sqrt( (finalDist * g) / sin(2*loft) )
        // Note: Projectile motion without air resistance.
        const v0 = Math.sqrt(Math.abs((finalDist * gravity) / Math.sin(2 * loftBox)));

        const vy = v0 * Math.sin(loftBox);
        const vHorizontal = v0 * Math.cos(loftBox);
        const vx = (lateralErr / finalDist) * vHorizontal; // Approx component
        const vz = vHorizontal; // Towards target mainly

        velocityRef.current.set(vx, vy, vz);
        isSimulatingRef.current = true;
        setGameMode('flying');
        setShotsLeft(prev => prev - 1);
    };

    const handlePutt = () => {
        if (isSimulatingRef.current) return;
        // Rolling physics
        const distToHole = Math.sqrt(
            Math.pow(targetPos[0] - ballPos[0], 2) +
            Math.pow(targetPos[2] - ballPos[2], 2)
        );

        // Power 100% = 30 yards max for putter
        const puttDist = selectedClub.maxDist * (power / 100);

        // Direction: simple straight to hole or slight error?
        // Vector to hole
        const dir = new THREE.Vector3(targetPos[0] - ballPos[0], 0, targetPos[2] - ballPos[2]).normalize();

        // Velocity for rolling (fake friction deaccel later)
        // v^2 = 2*a*d -> v = sqrt(2*a*d). Let's just move linearly for simulation simplicity in loop
        velocityRef.current.copy(dir).multiplyScalar(puttDist * 0.1); // Scaled speed

        // Putting "mode" for physics implies ground movement
        setGameMode('putting_active'); // distinct from 'putting' view
        isSimulatingRef.current = true;
        setShotsLeft(prev => prev - 1);
    };

    // --- Physics Loop ---
    // Using a custom component to hook into useFrame inside Canvas
    const PhysicsEngine = () => {
        useFrame((state, delta) => {
            if (!isSimulatingRef.current) return;

            const pos = ballRef.current;
            const vel = velocityRef.current;

            if (gameMode === 'flying') {
                // Air Physics
                pos.addScaledVector(vel, delta * 2); // Time speedup x2
                vel.y -= gravity * delta * 2;

                // Ground Check
                if (pos.y <= 0.3) {
                    pos.y = 0.3;
                    isSimulatingRef.current = false;

                    // Landing logic
                    const distToHole = pos.distanceTo(new THREE.Vector3(...targetPos));
                    setBallPos([pos.x, pos.y, pos.z]); // Update React state

                    if (distToHole < 1) {
                        setScore(s => s + 1000);
                        setMessage("¡HOYO EN UNO! 🦅");
                        setGameMode('hole-in');
                    } else if (distToHole < 20) {
                        setGameMode('putting');
                        setSelectedClub(CLUBS[4]); // Putter
                        setMessage(`¡En el Green! Distancia: ${distToHole.toFixed(1)}y. Usa el Putter.`);
                    } else {
                        setGameMode('landed'); // Ready for next shot (chip/approach)
                        // If still far, maybe keep same club or suggest
                        setMessage(`Tiro finalizado. Distancia al hoyo: ${distToHole.toFixed(1)}y`);
                    }
                } else {
                    // Only update react state occasionally to save renders? 
                    // Or update ref-based camera lookAt
                }
                // Force update view occasionally or use refs for smooth cam
                // For this simple demo, we rely on component re-render on stop, 
                // OR we can update a ref that Camera reads.
                // Let's update react state for Ball mesh every frame? Expensive but simplest for React.
                // Better: update mesh ref directly.
                // We will stick to state update on land, but visual mesh update in this loop.

                // Actually, we need to update the visual Mesh.
                // But the Ball is a React component. 
                // Let's use setBallPos for simple smooth animation if simple enough, or use ref.
                setBallPos([pos.x, pos.y, pos.z]);
            }

            else if (gameMode === 'putting_active') {
                // Rolling
                // Simple friction
                pos.addScaledVector(vel, delta * 5);
                vel.multiplyScalar(0.95); // Friction

                if (vel.length() < 0.1) {
                    isSimulatingRef.current = false;
                    // Check result
                    const finalPos = new THREE.Vector3(pos.x, 0, pos.z);
                    const holePos = new THREE.Vector3(targetPos[0], 0, targetPos[2]);
                    const dist = finalPos.distanceTo(holePos);

                    setBallPos([pos.x, 0.3, pos.z]);

                    if (dist < 1.0) { // Generous hole size
                        setScore(s => s + 500);
                        setMessage("¡ADENTRO! ⛳");
                        setTimeout(resetHole, 2000);
                    } else {
                        setGameMode('putting'); // Still putting
                        setMessage(`Cerca... a ${dist.toFixed(1)}y.`);
                    }
                }
                setBallPos([pos.x, 0.3, pos.z]);
            }
        });
        return null;
    };

    return (
        <div className="w-full h-screen pb-safe flex flex-col bg-gray-900">
            {/* 3D Viewport */}
            <div className="flex-grow relative">
                <Canvas shadows camera={{ position: [0, 5, -5], fov: 50 }}>
                    {/* Environment */}
                    <Suspense fallback={null}>
                        <Sky sunPosition={[100, 20, 100]} />
                        <ambientLight intensity={0.5} />
                        <directionalLight
                            position={[10, 20, 5]}
                            intensity={1}
                            castShadow
                            shadow-mapSize={[1024, 1024]}
                        />
                        <ContactShadows resolution={512} scale={100} blur={4} opacity={0.5} far={10} color="#000000" />
                    </Suspense>

                    {/* Game Objects */}
                    <Terrain />
                    <Ball position={ballPos} />
                    <Flag position={targetPos} />

                    {/* Logic */}
                    <PhysicsEngine />
                    <GameCamera ballPos={ballPos} targetPos={targetPos} mode={gameMode} />

                    {/* Helper Grid */}
                    <gridHelper args={[1000, 100]} position={[0, 0.1, 0]} />
                </Canvas>

                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between text-white drop-shadow-md pointer-events-none">
                    <div>
                        <h2 className="text-2xl font-bold italic">Simulador 3D</h2>
                        <p className="text-yellow-400 font-bold text-lg">{score} Puntos</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm uppercase opacity-80">Tiros Restantes</p>
                        <p className="text-3xl font-bold">{shotsLeft}</p>
                    </div>
                </div>

                {/* Center Message */}
                <div className="absolute top-1/4 left-0 right-0 text-center pointer-events-none">
                    <span className="bg-black/50 text-white px-4 py-2 rounded-full text-lg font-bold backdrop-blur-sm">
                        {message}
                    </span>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="bg-white p-4 pb-8 rounded-t-3xl shadow-2xl z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Palo</label>
                        <div className="flex overflow-x-auto gap-2 scrollbar-hide">
                            {gameMode === 'putting' ? (
                                <button className="px-4 py-2 bg-golf-deep text-white rounded-lg font-bold shadow-md">
                                    Putter (Auto)
                                </button>
                            ) : (
                                CLUBS.filter(c => c.name !== 'Putter').map(c => (
                                    <button
                                        key={c.name}
                                        onClick={() => setSelectedClub(c)}
                                        className={`px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${selectedClub.name === c.name ? 'bg-golf-deep text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                                    >
                                        {c.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between text-sm font-bold mb-2">
                        <span>Potencia</span>
                        <span className="text-golf-deep">{power}%</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        className="w-full h-6 bg-gray-200 rounded-full appearance-none cursor-pointer accent-golf-deep"
                    />
                </div>

                <button
                    onClick={gameMode === 'putting' ? handlePutt : handleSwing}
                    disabled={shotsLeft <= 0 || isSimulatingRef.current}
                    className={`w-full py-4 rounded-2xl font-black text-xl shadow-lg transition transform active:scale-95 ${gameMode === 'putting' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gradient-to-r from-elegant-gold to-yellow-500 text-golf-deep hover:brightness-110'}`}
                >
                    {shotsLeft <= 0 ? "Juego Terminado - Reiniciar" : (gameMode === 'putting' ? "⛳ PUTT ⛳" : "🏌️ GOPEAR")}
                </button>

                {shotsLeft <= 0 && (
                    <button onClick={resetHole} className="w-full mt-2 py-2 text-gray-500 font-bold underline">
                        Reiniciar
                    </button>
                )}
            </div>
        </div>
    );
};

export default GolfSimulator;
