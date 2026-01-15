import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Float, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';

// --- Constants ---
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

// Optimized Ball using Refs
function Ball({ positionRef }) {
    const meshRef = useRef();
    useFrame(() => {
        if (meshRef.current && positionRef.current) {
            meshRef.current.position.copy(positionRef.current);
        }
    });
    return (
        <mesh ref={meshRef} castShadow receiveShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="white" roughness={0.4} metalness={0.1} />
        </mesh>
    );
}

function Flag({ position }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.5, 32]} />
                <meshBasicMaterial color="#2d3436" />
            </mesh>
            <mesh position={[0, 2.5, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 5, 8]} />
                <meshStandardMaterial color="#bdc3c7" />
            </mesh>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh position={[0, 4.25, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
                    <boxGeometry args={[0.1, 1.5, 2]} />
                    <meshStandardMaterial color="#e74c3c" />
                </mesh>
            </Float>
        </group>
    );
}

// Simple shape hazards for performance
function Lake({ position, radius }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.05, position[2]]}>
            <circleGeometry args={[radius, 32]} />
            <meshStandardMaterial color="#2980b9" roughness={0.1} metalness={0.8} opacity={0.8} transparent />
        </mesh>
    );
}

function Tree({ position }) {
    return (
        <group position={position}>
            {/* Trunk */}
            <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.7, 3, 6]} />
                <meshStandardMaterial color="#5d4037" />
            </mesh>
            {/* Foliage */}
            <mesh position={[0, 4.5, 0]} castShadow>
                <dodecahedronGeometry args={[2.5]} />
                <meshStandardMaterial color="#2d6a4f" />
            </mesh>
        </group>
    );
}

function Terrain() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial color="#27ae60" roughness={0.8} />
        </mesh>
    );
}

function GameCamera({ ballRef, targetPos, mode }) {
    const { camera } = useThree();
    const targetVec = new THREE.Vector3(...targetPos);

    useFrame((state) => {
        const ballVec = ballRef.current ? ballRef.current : new THREE.Vector3(0, 0.3, 0);

        if (mode === 'intro') {
            camera.position.lerp(new THREE.Vector3(targetVec.x / 2, 80, targetVec.z / 2 + 50), 0.02);
            camera.lookAt(targetVec.x / 2, 0, targetVec.z / 2);
        }
        else if (mode === 'putting') {
            // Updated Zoom for putting
            const camPos = new THREE.Vector3(targetVec.x, 6, targetVec.z + 6);
            camera.position.lerp(camPos, 0.05);
            camera.lookAt(targetVec.x, 0, targetVec.z);
        }
        else if (mode === 'flying') {
            const offset = new THREE.Vector3(0, 8, -15);
            const desired = ballVec.clone().add(offset);
            camera.position.lerp(desired, 0.1);
            camera.lookAt(ballVec);
        } else {
            // Tee
            const dirToTarget = new THREE.Vector3().subVectors(targetVec, ballVec).normalize();
            const offset = dirToTarget.clone().multiplyScalar(-5).add(new THREE.Vector3(0, 2, 0));
            const camPos = ballVec.clone().add(offset);
            camera.position.lerp(camPos, 0.1);
            camera.lookAt(targetVec);
        }
    });
    return null;
}

// --- Main Components --- //

function Green({ position }) {
    return (
        <group position={position}>
            {/* Green Surface - Slightly elevated */}
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[10, 64]} />
                <meshStandardMaterial color="#2ecc71" roughness={0.6} />
            </mesh>
            {/* Fringe */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[10, 11, 32]} />
                <meshStandardMaterial color="#27ae60" />
            </mesh>
        </group>
    );
}

const GolfSimulator = () => {
    const { t } = useTranslation();

    // UI State
    const [uiSync, setUiSync] = useState(0);
    const [gameMode, setGameMode] = useState('intro');
    const [message, setMessage] = useState("");

    // Hole Config
    const [holePar, setHolePar] = useState(3);
    const [holeDist, setHoleDist] = useState(150);
    const [strokeCount, setStrokeCount] = useState(0);

    const [targetPos, setTargetPos] = useState([0, 0, 150]);
    const [hazards, setHazards] = useState({ trees: [], lakes: [] });

    // Physics Refs
    const ballRef = useRef(new THREE.Vector3(0, 0.3, 0));
    const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
    const isSimulatingRef = useRef(false);

    const [selectedClub, setSelectedClub] = useState(CLUBS[2]);
    const [power, setPower] = useState(80);

    useEffect(() => {
        generateHole();
    }, []);

    const generateHole = () => {
        // Random Design
        const dist = Math.floor(Math.random() * 250) + 120; // 120 - 370y
        const par = dist > 280 ? 4 : 3;

        // Target is always straight Z for simplicity, but we place hazards to block
        setHolePar(par);
        setHoleDist(dist);
        setTargetPos([0, 0, dist]);

        // Reset Ball
        ballRef.current.set(0, 0.3, 0);
        setUiSync(s => s + 1);
        setStrokeCount(0);
        setGameMode('intro');
        setMessage(`Hoyo Par ${par} - ${dist} Yardas`);

        // Generate Hazards
        const newTrees = [];
        const newLakes = [];

        // 1. Trees (scattered on sides)
        for (let i = 0; i < 15; i++) {
            const z = Math.random() * (dist + 20);
            const x = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 30 + 10); // Left or Right > 10m
            newTrees.push([x, 0, z]);
        }

        // 2. Obstacle Trees (in fairway?)
        if (Math.random() > 0.7) {
            newTrees.push([(Math.random() - 0.5) * 10, 0, dist * 0.5]);
        }

        // 3. Lakes (Water hazards)
        if (Math.random() > 0.5) {
            const z = Math.random() * (dist - 40) + 20;
            const x = (Math.random() - 0.5) * 40;
            newLakes.push({ pos: [x, 0, z], radius: 8 + Math.random() * 8 });
        }

        setHazards({ trees: newTrees, lakes: newLakes });

        // Auto Club
        if (dist > 220) setSelectedClub(CLUBS[0]);
        else if (dist > 150) setSelectedClub(CLUBS[2]);
        else setSelectedClub(CLUBS[4]);
    };

    const handleSwing = () => {
        if (isSimulatingRef.current || gameMode === 'intro') return;

        const clubPower = power / 100;
        const dist = selectedClub.maxDist * clubPower;
        const loftBox = (selectedClub.loft * Math.PI) / 180;

        // Accuracy
        const accuracy = 0.9 + Math.random() * 0.2; // 0.9 - 1.1 scale
        const finalDist = dist * accuracy;
        const lateralErr = (Math.random() - 0.5) * (finalDist * 0.15); // Slice/Hook

        // Physics V0
        const gravity = 9.8;
        const v0 = Math.sqrt(Math.abs((finalDist * gravity) / Math.sin(2 * loftBox)));

        const vy = v0 * Math.sin(loftBox);
        const vHorizontal = v0 * Math.cos(loftBox);
        const vx = (lateralErr / finalDist) * vHorizontal;
        const vz = vHorizontal;

        velocityRef.current.set(vx, vy, vz);
        isSimulatingRef.current = true;
        setGameMode('flying');
        setStrokeCount(s => s + 1);
        setMessage("¡Buen contacto!");
    };

    const handlePutt = () => {
        if (isSimulatingRef.current) return;
        const puttDist = selectedClub.maxDist * (power / 100);
        const dir = new THREE.Vector3(targetPos[0] - ballRef.current.x, 0, targetPos[2] - ballRef.current.z).normalize();
        velocityRef.current.copy(dir).multiplyScalar(puttDist * 0.15);

        setGameMode('putting_active');
        isSimulatingRef.current = true;
        setStrokeCount(s => s + 1);
    };

    // --- Physics Engine ---
    const PhysicsEngine = () => {
        useFrame((state, delta) => {
            if (!isSimulatingRef.current) return;
            const dt = Math.min(delta, 0.1);

            const pos = ballRef.current;
            const vel = velocityRef.current;
            const gravity = 9.8;

            // -- Flight --
            if (gameMode === 'flying') {
                pos.addScaledVector(vel, dt * 3);
                vel.y -= gravity * dt * 3;

                // Check Tree Collision (Simple Cylinder check)
                hazards.trees.forEach(tPos => {
                    const dx = pos.x - tPos[0];
                    const dz = pos.z - tPos[2];
                    // trunk radius 0.5 + ball 0.3 = 0.8. Height 6m
                    if (pos.y < 6 && Math.sqrt(dx * dx + dz * dz) < 1.0) {
                        vel.multiplyScalar(-0.5); // Bounce back!
                        setMessage("💥 ¡Árbol!");
                    }
                });

                // Ground
                if (pos.y <= 0.3) {
                    pos.y = 0.3;
                    isSimulatingRef.current = false;

                    // Check Water
                    let insideLake = false;
                    for (const l of hazards.lakes) {
                        const dx = pos.x - l.pos[0];
                        const dz = pos.z - l.pos[2];
                        if (Math.sqrt(dx * dx + dz * dz) < l.radius) insideLake = true;
                    }

                    if (insideLake) {
                        // Reset with Penalty
                        setGameMode('tee');
                        ballRef.current.set(0, 0.3, 0); // Back to tee for simplicity or drop area?
                        setStrokeCount(s => s + 1); // Penalty stroke
                        setMessage("🌊 ¡Agua! +1 Golpe y Reinicio.");
                        setUiSync(s => s + 1);
                        return;
                    }

                    const distToHole = pos.distanceTo(new THREE.Vector3(...targetPos));

                    if (distToHole < 0.5) endHole();
                    else if (distToHole < 20) {
                        setGameMode('putting');
                        setSelectedClub(CLUBS[6]);
                        setMessage(`Green - ${distToHole.toFixed(1)}y`);
                    } else {
                        setGameMode('tee');
                        setMessage(`${distToHole.toFixed(0)}y al hoyo`);
                        const best = CLUBS.find(c => c.maxDist >= distToHole) || CLUBS[0];
                        setSelectedClub(best);
                    }
                    setUiSync(s => s + 1);
                }
            }
            // -- Putting --
            else if (gameMode === 'putting_active') {
                pos.addScaledVector(vel, dt * 5);
                vel.multiplyScalar(0.95);

                if (vel.length() < 0.1) {
                    isSimulatingRef.current = false;
                    const holePos = new THREE.Vector3(...targetPos);
                    holePos.y = 0.3;
                    const d = pos.distanceTo(holePos);
                    if (d < 0.8) endHole();
                    else {
                        setGameMode('putting');
                        setMessage(`Cerca - ${d.toFixed(1)}y`);
                    }
                    setUiSync(s => s + 1);
                }
            }
        });
        return null;
    };

    const endHole = () => {
        setGameMode('hole-out');
        ballRef.current.set(...targetPos);
        setUiSync(s => s + 1);
        setMessage(`¡Terminado en ${strokeCount + 1} golpes!`);
    };

    return (
        <div className="w-full h-screen pb-safe flex flex-col bg-gray-900 font-sans">
            <div className="flex-grow relative overflow-hidden">
                <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 5, -5], fov: 60 }}>
                    <Suspense fallback={null}>
                        <Sky sunPosition={[100, 40, 100]} turbidity={0.5} rayleigh={0.5} />
                        <ambientLight intensity={0.7} />
                        <directionalLight position={[50, 50, 25]} intensity={1.5} castShadow />
                    </Suspense>

                    <Terrain />
                    <Green position={targetPos} />
                    {hazards.trees.map((t, i) => <Tree key={i} position={t} />)}
                    {hazards.lakes.map((l, i) => <Lake key={i} position={l.pos} radius={l.radius} />)}

                    <Ball positionRef={ballRef} />
                    <Flag position={targetPos} />

                    <PhysicsEngine />
                    <GameCamera ballRef={ballRef} targetPos={targetPos} mode={gameMode} />
                </Canvas>


                {/* HUD Overlay - Cleaned up */}
                <div className="absolute top-4 left-4 text-white/50 text-xs pointer-events-none z-10 font-mono">
                    v3.8 | Wind: {windSpeed}km/h {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(((windDirection + 22.5) % 360) / 45)]}
                </div>
                <div className="absolute top-4 left-4 right-4 flex justify-between text-white z-10 pointer-events-none">
                    <div className="bg-black/40 p-3 rounded-xl backdrop-blur-md">
                        <div className="text-xl font-bold italic">Caddy 3D </div>
                        <div className="text-sm font-bold text-gray-300">Par {holePar} • {holeDist}y</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl backdrop-blur-md text-right">
                        <div className="text-xs text-gray-400 uppercase">Golpes</div>
                        <div className="text-2xl font-black">{strokeCount}</div>
                    </div>
                </div>

                {/* Intro Message */}
                {gameMode === 'intro' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-sm animate-fade-in-up">
                            <h2 className="text-2xl font-black text-golf-deep mb-2">Hoyo Generado</h2>
                            <p className="text-gray-600 mb-6 font-bold">Evita el agua y los árboles 🌲🌊</p>
                            <button onClick={() => setGameMode('tee')} className="w-full py-4 bg-golf-deep text-white font-black rounded-xl shadow-lg hover:scale-105 transition">
                                COMENZAR ⛳
                            </button>
                        </div>
                    </div>
                )}

                {/* End Message */}
                {gameMode === 'hole-out' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-sm animate-bounce-in">
                            <div className="text-5xl mb-2">🏆</div>
                            <h2 className="text-3xl font-black mb-2">¡Hoyo!</h2>
                            <p className="text-xl mb-4 text-gray-700">{message}</p>
                            <button onClick={generateHole} className="w-full py-3 bg-elegant-gold font-bold rounded-xl shadow-lg">
                                Siguiente ➡️
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            {gameMode !== 'intro' && gameMode !== 'hole-out' && (
                <div className="bg-white p-4 pb-8 rounded-t-3xl shadow-2xl z-20">
                    <div className="flex overflow-x-auto gap-2 mb-4 scrollbar-hide pb-2">
                        {CLUBS.map(c => (
                            <button key={c.name} onClick={() => setSelectedClub(c)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${selectedClub.name === c.name ? 'bg-golf-deep text-white shadow-lg' : 'bg-gray-50 text-gray-500'}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span>POTENCIA</span>
                            <span className="text-golf-deep">{power}%</span>
                        </div>
                        <input type="range" min="1" max="100" value={power} onChange={e => setPower(e.target.value)} className="w-full h-2 bg-gray-200 rounded-full accent-golf-deep" />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={generateHole} className="aspect-square p-4 bg-gray-100 rounded-xl font-bold">🔄</button>
                        <button onClick={gameMode === 'putting' ? handlePutt : handleSwing}
                            className={`flex-1 py-4 font-black text-white text-lg rounded-xl shadow-lg transition active:scale-95 ${gameMode === 'putting' ? 'bg-green-600' : 'bg-golf-deep'}`}>
                            {gameMode === 'putting' ? "PUTT" : "SWING 🏌️"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GolfSimulator;
