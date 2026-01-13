import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Text, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';

// --- Constants & Data ---
const CLUBS = [
    { name: 'Driver', maxDist: 260, loft: 10.5, color: '#e74c3c' },
    { name: '3 Wood', maxDist: 230, loft: 15, color: '#e67e22' },
    { name: '5 Iron', maxDist: 180, loft: 27, color: '#f1c40f' },
    { name: '7 Iron', maxDist: 155, loft: 34, color: '#2ecc71' },
    { name: 'PW', maxDist: 125, loft: 46, color: '#3498db' },
    { name: 'SW', maxDist: 90, loft: 56, color: '#9b59b6' },
    { name: 'Putter', maxDist: 30, loft: 0, color: '#34495e' }
];

// --- 3D Components ---

function Ball({ positionRef }) {
    const meshRef = useRef();

    // Sync mesh position with ref on every frame for smooth animation without re-renders
    useFrame(() => {
        if (meshRef.current && positionRef.current) {
            meshRef.current.position.copy(positionRef.current);
        }
    });

    return (
        <mesh ref={meshRef} castShadow receiveShadow>
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
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh position={[0, 4.25, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
                    <boxGeometry args={[0.1, 1.5, 2]} />
                    <meshStandardMaterial color="#e74c3c" />
                </mesh>
            </Float>
        </group>
    );
}

function Bunker({ position, width = 8, length = 12 }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.02, position[2]]} receiveShadow>
            <ellipseGeometry args={[width, length, 32]} />
            <meshStandardMaterial color="#f6d7b0" roughness={1} />
        </mesh>
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

function GameCamera({ ballRef, targetPos, mode }) {
    const { camera } = useThree();
    const targetVec = new THREE.Vector3(...targetPos);

    useFrame((state) => {
        // Current ball pos from ref
        const ballVec = ballRef.current ? ballRef.current : new THREE.Vector3(0, 0.3, 0);

        if (mode === 'intro') {
            // Fly from high above green to tee
            camera.position.lerp(new THREE.Vector3(targetVec.x / 2, 100, targetVec.z / 2 + 50), 0.05);
            camera.lookAt(targetVec.x / 2, 0, targetVec.z / 2);
        } else if (mode === 'putting') {
            const camPos = new THREE.Vector3(targetVec.x, 8, targetVec.z + 8);
            camera.position.lerp(camPos, 0.05);
            camera.lookAt(targetVec.x, 0, targetVec.z);
        } else if (mode === 'flying') {
            // Follow ball
            const offset = new THREE.Vector3(0, 10, -20);
            const desired = ballVec.clone().add(offset);
            camera.position.lerp(desired, 0.1);
            camera.lookAt(ballVec);
        } else {
            // Tee / Address
            // Behind ball looking at target
            // Direction vector
            const dirToTarget = new THREE.Vector3().subVectors(targetVec, ballVec).normalize();
            const offset = dirToTarget.clone().multiplyScalar(-5).add(new THREE.Vector3(0, 2, 0)); // 5m behind, 2m up
            const camPos = ballVec.clone().add(offset);

            camera.position.lerp(camPos, 0.1);
            camera.lookAt(targetVec);
        }
    });
    return null;
}

// --- Main Simulator Component ---

const GolfSimulator = () => {
    const { t } = useTranslation();

    // Game Physics State (Refs for performance)
    const ballRef = useRef(new THREE.Vector3(0, 0.3, 0));
    const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
    const isSimulatingRef = useRef(false);
    const isInBunkerRef = useRef(false);
    // Track ball landing pos for React updates (UI only) - we don't strictly need it for render if using refs, but good for react synch
    const [uiSync, setUiSync] = useState(0); // Dummy state to force render when needed

    // Game Logic State
    const [targetPos, setTargetPos] = useState([0, 0, 150]);
    const [bunkers, setBunkers] = useState([]);

    const [holePar, setHolePar] = useState(3);
    const [holeDist, setHoleDist] = useState(150);
    const [strokeCount, setStrokeCount] = useState(0);

    const [gameMode, setGameMode] = useState('intro'); // intro, tee, flying, putting, hole-out
    const [message, setMessage] = useState("");

    // Shot Params
    const [selectedClub, setSelectedClub] = useState(CLUBS[2]);
    const [power, setPower] = useState(80);

    useEffect(() => {
        generateHole();
    }, []);

    const generateHole = () => {
        // Random Par 3, 4, 5
        const rand = Math.random();
        let par = 3;
        let dist = 150;

        if (rand < 0.33) {
            par = 3;
            dist = Math.floor(Math.random() * 50) + 130; // 130-180
        } else if (rand < 0.66) {
            par = 4;
            dist = Math.floor(Math.random() * 100) + 280; // 280-380
        } else {
            par = 5;
            dist = Math.floor(Math.random() * 100) + 450; // 450-550
        }

        setHolePar(par);
        setHoleDist(dist);
        setTargetPos([0, 0, dist]);

        // Reset Ball Physics
        ballRef.current.set(0, 0.3, 0);
        setUiSync(s => s + 1); // update

        setStrokeCount(0);
        setGameMode('intro'); // Start with intro view
        setMessage(`Hoyo Par ${par} - ${dist} Yardas`);

        // Generate Bunkers along the fairway/green
        const newBunkers = [];
        const numBunkers = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < numBunkers; i++) {
            // Random pos between 50y and Target
            const z = Math.random() * (dist - 20) + 50;
            const x = (Math.random() - 0.5) * 40; // Spread width
            newBunkers.push({ pos: [x, 0, z], width: 5 + Math.random() * 5, length: 5 + Math.random() * 5 });
        }
        setBunkers(newBunkers);

        // Initial club selection
        if (dist > 220) setSelectedClub(CLUBS[0]);
        else if (dist > 150) setSelectedClub(CLUBS[2]);
        else setSelectedClub(CLUBS[4]);
    };

    const startGame = () => {
        setGameMode('tee');
        setMessage("¡A jugar! Elige tu palo.");
    };

    const handleSwing = () => {
        if (isSimulatingRef.current || gameMode === 'intro' || gameMode === 'hole-out') return;

        let clubPower = power / 100;

        // Penalize if in bunker
        if (isInBunkerRef.current) {
            // Can only hit so far from sand
            clubPower *= 0.6; // 40% loss
            // Force pop up?
            if (selectedClub.name === 'Driver') {
                setMessage("¡No uses Driver en el bunker! (Penalizado)");
                clubPower *= 0.2;
            }
        }

        const dist = selectedClub.maxDist * clubPower;
        const loftBox = (selectedClub.loft * Math.PI) / 180;
        const accuracy = 0.95 + Math.random() * 0.1;
        const finalDist = dist * accuracy;
        const lateralErr = (Math.random() - 0.5) * (finalDist * (isInBunkerRef.current ? 0.2 : 0.1));

        const gravity = 9.8;
        const v0 = Math.sqrt(Math.abs((finalDist * gravity) / Math.sin(2 * loftBox)));

        const vy = v0 * Math.sin(loftBox);
        const vHorizontal = v0 * Math.cos(loftBox);
        const vx = (lateralErr / finalDist) * vHorizontal;
        const vz = vHorizontal;

        velocityRef.current.set(vx, vy, vz);
        isSimulatingRef.current = true;
        isInBunkerRef.current = false; // exiting bunker
        setGameMode('flying');
        setStrokeCount(s => s + 1);
        setMessage(isInBunkerRef.current ? "¡Sacada de bunker!" : "¡Buen swing!");
    };

    const handlePutt = () => {
        if (isSimulatingRef.current) return;
        const puttDist = selectedClub.maxDist * (power / 100);
        // Direction from CURRENT ball ref position
        const dir = new THREE.Vector3(targetPos[0] - ballRef.current.x, 0, targetPos[2] - ballRef.current.z).normalize();
        velocityRef.current.copy(dir).multiplyScalar(puttDist * 0.15);

        setGameMode('putting_active');
        isSimulatingRef.current = true;
        setStrokeCount(s => s + 1);
    };

    // Physics Loop
    const PhysicsEngine = () => {
        useFrame((state, delta) => {
            if (!isSimulatingRef.current) return;

            const pos = ballRef.current; // Direct ref mutation
            const vel = velocityRef.current;
            const gravity = 9.8;

            if (gameMode === 'flying') {
                // Air Physics
                pos.addScaledVector(vel, delta * 3); // Faster sim
                vel.y -= gravity * delta * 3;

                // Ground Check
                if (pos.y <= 0.3) {
                    pos.y = 0.3;
                    isSimulatingRef.current = false;

                    // Logic only runs ONCE when landing
                    // Check Bunker
                    let inBunker = false;
                    for (let b of bunkers) {
                        const dx = pos.x - b.pos[0];
                        const dz = pos.z - b.pos[2];
                        if (Math.abs(dx) < b.width / 1.5 && Math.abs(dz) < b.length / 1.5) {
                            inBunker = true;
                            break;
                        }
                    }
                    isInBunkerRef.current = inBunker;
                    const distToHole = pos.distanceTo(new THREE.Vector3(...targetPos));

                    // Update React State ONLY on land to sync UI
                    setUiSync(s => s + 1);

                    if (distToHole < 0.5) { // Dunking it
                        endHole();
                    } else if (inBunker) {
                        setGameMode('tee');
                        setSelectedClub(CLUBS[5]);
                        setMessage(`¡Caíste en el Bunker! Usa el SW.`);
                    } else if (distToHole < 20) {
                        setGameMode('putting');
                        setSelectedClub(CLUBS[6]); // Putter
                        setMessage(`En el Green. A ${distToHole.toFixed(1)}y.`);
                    } else {
                        setGameMode('tee');
                        const remDist = distToHole;
                        const bestClub = CLUBS.find(c => c.maxDist >= remDist) || CLUBS[0];
                        setSelectedClub(bestClub);
                        setMessage(`${remDist.toFixed(0)}y al hoyo.`);
                    }
                }
            }
            else if (gameMode === 'putting_active') {
                // Rolling
                pos.addScaledVector(vel, delta * 5);
                vel.multiplyScalar(0.96); // Friction

                if (vel.length() < 0.1) {
                    isSimulatingRef.current = false;
                    // Check result
                    const finalPos = new THREE.Vector3(pos.x, 0, pos.z);
                    const holePos = new THREE.Vector3(targetPos[0], 0, targetPos[2]);
                    const dist = finalPos.distanceTo(holePos);

                    setUiSync(s => s + 1); // Visual sync

                    if (dist < 1.0) {
                        endHole();
                    } else {
                        setGameMode('putting');
                        setMessage(`¡Cerca! A ${dist.toFixed(1)}y.`);
                    }
                }
            }
        });
        return null;
    };

    const endHole = () => {
        setGameMode('hole-out');
        ballRef.current.set(...targetPos); // Snap visual
        setUiSync(s => s + 1);

        let res = "";
        const diff = strokeCount + 1 - holePar; // +1 because current stroke just finished
        if (diff <= -2) res = "🦅 ¡EAGLE!";
        else if (diff === -1) res = "🐦 ¡BIRDIE!";
        else if (diff === 0) res = "😐 PAR";
        else if (diff === 1) res = "😕 BOGEY";
        else res = "💀 DOBLE BOGEY o +";

        if (strokeCount + 1 === 1) res = "🏆 ¡HOYO EN UNO!";

        setMessage(`${res} - Total: ${strokeCount + 1} golpes.`);
    };

    return (
        <div className="w-full h-screen pb-safe flex flex-col bg-gray-900 font-sans">
            {/* 3D Viewport */}
            <div className="flex-grow relative overflow-hidden">
                <Canvas shadows camera={{ position: [0, 5, -5], fov: 60 }}>
                    <Suspense fallback={null}>
                        <Sky sunPosition={[100, 40, 100]} />
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[10, 40, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
                        <ContactShadows resolution={512} scale={200} blur={2} opacity={0.4} far={20} color="#000000" />
                    </Suspense>

                    <Terrain />
                    {/* Pass REF to Ball, not state */}
                    <Ball positionRef={ballRef} />
                    <Flag position={targetPos} />
                    {bunkers.map((b, i) => <Bunker key={i} position={b.pos} width={b.width} length={b.length} />)}

                    <PhysicsEngine />
                    {/* Camera also follows Ref */}
                    <GameCamera ballRef={ballRef} targetPos={targetPos} mode={gameMode} />

                    <gridHelper args={[2000, 200]} position={[0, 0.1, 0]} />
                </Canvas>

                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between text-white drop-shadow-md pointer-events-none z-10">
                    <div className="bg-black/30 p-2 rounded-xl backdrop-blur-sm">
                        <h2 className="text-xl font-bold italic">Caddy 3D</h2>
                        <p className="text-yellow-400 font-bold text-md">Hoyo {holePar === 3 ? '#' : 'Random'}</p>
                    </div>
                    <div className="text-right bg-black/30 p-2 rounded-xl backdrop-blur-sm">
                        <div className="flex gap-4">
                            <div>
                                <p className="text-[10px] uppercase opacity-80">Par</p>
                                <p className="text-2xl font-bold">{holePar}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase opacity-80">Golpes</p>
                                <p className="text-2xl font-bold text-white">{strokeCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Message */}
                {message && (
                    <div className="absolute top-1/4 left-0 right-0 text-center pointer-events-none z-10 animate-fade-in-up">
                        <span className="bg-gradient-to-r from-golf-deep to-black text-white px-6 py-3 rounded-full text-lg font-bold shadow-xl border-2 border-white/20">
                            {message}
                        </span>
                    </div>
                )}

                {/* Intro / Outline */}
                {gameMode === 'intro' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-[2px]">
                        <div className="text-center bg-white p-8 rounded-3xl shadow-2xl max-w-sm mx-4 animate-scale-in">
                            <h3 className="text-4xl font-black text-golf-deep mb-2">Hoyo Generado</h3>
                            <div className="flex justify-center gap-4 my-6 text-gray-700">
                                <div className="text-center">
                                    <div className="text-sm font-bold uppercase">Par</div>
                                    <div className="text-3xl font-black">{holePar}</div>
                                </div>
                                <div className="text-center border-l pl-4">
                                    <div className="text-sm font-bold uppercase">Distancia</div>
                                    <div className="text-3xl font-black">{holeDist}y</div>
                                </div>
                            </div>
                            <button onClick={startGame} className="w-full bg-elegant-gold hover:bg-yellow-400 text-golf-deep font-black py-4 rounded-xl text-xl shadow-lg transition">
                                ⛳ COMENZAR
                            </button>
                        </div>
                    </div>
                )}

                {gameMode === 'hole-out' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                        <div className="text-center bg-white p-8 rounded-3xl shadow-2xl transform scale-110">
                            <h3 className="text-5xl mb-4">🙌</h3>
                            <h3 className="text-3xl font-black text-golf-deep mb-2">¡Hoyo Terminado!</h3>
                            <p className="text-xl text-gray-600 mb-6">{message}</p>
                            <div className="flex gap-4">
                                <button onClick={generateHole} className="flex-1 bg-golf-deep text-white font-bold py-3 px-6 rounded-xl hover:bg-golf-dark transition">
                                    Siguiente Hoyo ➡️
                                </button>
                                <button onClick={() => { setStrokeCount(0); generateHole(); }} className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-300">
                                    Reiniciar 🔄
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Panel */}
            {gameMode !== 'intro' && gameMode !== 'hole-out' && (
                <div className="bg-white p-4 pb-8 rounded-t-3xl shadow-2xl z-20">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex-1 overflow-hidden">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Palo Seleccionado</label>
                            <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-1">
                                {gameMode === 'putting' ? (
                                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold shadow-md w-full">
                                        Putter (Green)
                                    </button>
                                ) : (
                                    CLUBS.filter(c => c.name !== 'Putter').map(c => (
                                        <button
                                            key={c.name}
                                            onClick={() => setSelectedClub(c)}
                                            className={`px-3 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition border ${selectedClub.name === c.name ? 'bg-golf-deep text-white border-golf-deep shadow-md' : 'bg-gray-50 text-gray-500 border-gray-100'}`}
                                        >
                                            {c.name} ({c.maxDist}y)
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold mb-2 uppercase text-gray-500">
                            <span>Potencia</span>
                            <span className="text-golf-deep">{power}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={power}
                            onChange={(e) => setPower(e.target.value)}
                            className="w-full h-4 bg-gray-200 rounded-full appearance-none cursor-pointer accent-golf-deep"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={generateHole}
                            className="p-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition"
                            title="Reiniciar Hoyo"
                        >
                            🔄
                        </button>
                        <button
                            onClick={gameMode === 'putting' ? handlePutt : handleSwing}
                            disabled={isSimulatingRef.current}
                            className={`flex-1 py-4 rounded-2xl font-black text-xl shadow-lg transition transform active:scale-95 ${gameMode === 'putting' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gradient-to-r from-elegant-gold to-yellow-500 text-golf-deep hover:brightness-110'}`}
                        >
                            {isSimulatingRef.current ? "Volando..." : (gameMode === 'putting' ? "⛳ PUTT" : "🏌️ GOLPEAR")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GolfSimulator;
