import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ARModule = ({ weather }) => {
    const { t } = useTranslation();
    const [selectedModel, setSelectedModel] = useState('ball');
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);

    // Dynamically load model-viewer
    useEffect(() => {
        const scriptId = 'model-viewer-script';
        let script = document.getElementById(scriptId);

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'module';
            script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
            script.async = true;

            script.onload = () => {
                console.log("AR Engine Loaded Successfully");
                setScriptLoaded(true);
            };

            script.onerror = () => {
                console.error("Failed to load AR Engine");
                setLoadError(true);
            };

            document.head.appendChild(script);
        } else {
            // Check if already loaded or wait for it
            if (window.customElements && window.customElements.get('model-viewer')) {
                setScriptLoaded(true);
            } else {
                script.addEventListener('load', () => setScriptLoaded(true));
                script.addEventListener('error', () => setLoadError(true));
            }
        }
    }, []);

    const models = {
        ball: {
            url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
            name: t('ar.ball'),
            description: 'Modelo de alta fidelidad para práctica de visualización.'
        },
        club: {
            url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
            name: t('ar.club'),
            description: 'Análisis de diseño y ergonomía en 3D.'
        },
        hole: {
            url: 'https://modelviewer.dev/shared-assets/models/Chair.glb',
            name: t('ar.hole'),
            description: 'Posicionamiento espacial para entrenamiento de putt.'
        }
    };

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8 text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-2">Error de Conexión</h2>
                <p className="text-gray-400 mb-6">No se pudo cargar el motor de Realidad Aumentada. Por favor, verifica tu conexión a internet.</p>
                <button onClick={() => window.location.reload()} className="bg-elegant-gold text-golf-deep font-bold px-6 py-2 rounded-full">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up flex flex-col h-full bg-gradient-to-b from-gray-900 to-black text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            {/* Header */}
            <div className="p-6 bg-white/5 backdrop-blur-md border-b border-white/10 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-elegant-gold to-yellow-200 bg-clip-text text-transparent italic">
                        {t('ar.title')}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${scriptLoaded ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-bounce'}`}></span>
                        <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                            {scriptLoaded ? 'SISTEMA AR ACTIVO' : 'CARGANDO MOTOR...'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-500 font-mono italic opacity-50 text-right block">AR ENGINE v4.0.0</span>
                    {weather && <span className="text-[10px] text-gray-400">{weather.temp}°C • {weather.wind_speed}km/h</span>}
                </div>
            </div>

            {/* 3D Viewer Area */}
            <div className="relative flex-grow bg-black/40 group overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                {!scriptLoaded ? (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/50">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-elegant-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-elegant-gold font-bold text-xs tracking-widest animate-pulse">SINCRONIZANDO...</p>
                        </div>
                    </div>
                ) : (
                    <model-viewer
                        id="golf-ar-viewer"
                        src={models[selectedModel].url}
                        alt="A 3D model of golf equipment"
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        auto-rotate
                        shadow-intensity="2"
                        shadow-softness="1"
                        exposure="1.2"
                        environment-image="neutral"
                        loading="eager"
                        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                    >
                        <button slot="ar-button" className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-elegant-gold to-yellow-500 text-golf-deep font-black px-10 py-5 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border-2 border-white/20 whitespace-nowrap">
                            <span className="text-xl">🥽</span> {t('ar.viewInSpace').toUpperCase()}
                        </button>

                        <div slot="progress-bar" className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 transition-opacity duration-300">
                            <div className="flex flex-col items-center text-center p-6">
                                <div className="w-16 h-16 border-4 border-elegant-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-elegant-gold font-bold tracking-[0.3em] animate-pulse text-xs uppercase">Descargando Activos 3D...</p>
                            </div>
                        </div>
                    </model-viewer>
                )}

                {/* Floating Info Card */}
                <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 max-w-[200px] transform transition-transform group-hover:translate-x-2">
                        <h3 className="font-black text-elegant-gold text-sm mb-1 uppercase tracking-tighter">{models[selectedModel].name}</h3>
                        <p className="text-[10px] text-gray-400 leading-tight">{models[selectedModel].description}</p>
                    </div>
                </div>
            </div>

            {/* Model Selector Bar */}
            <div className="p-8 bg-black/60 backdrop-blur-2xl border-t border-white/10">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 px-2">
                    {Object.entries(models).map(([key, model]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedModel(key)}
                            className={`flex-shrink-0 relative group transition-all duration-500 ${selectedModel === key ? 'scale-110' : 'opacity-40 hover:opacity-80'
                                }`}
                        >
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-2 border-2 transition-all duration-500 ${selectedModel === key
                                ? 'bg-elegant-gold border-white shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                                : 'bg-white/5 border-white/10'
                                }`}>
                                {key === 'ball' ? '⛳' : key === 'club' ? '🏌️' : '🕳️'}
                            </div>
                            <div className={`text-[9px] font-black text-center uppercase tracking-widest ${selectedModel === key ? 'text-elegant-gold' : 'text-gray-500'}`}>
                                {model.name}
                            </div>
                            {selectedModel === key && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer / Meta Data */}
            <div className="bg-elegant-gold p-1 text-[8px] font-black text-golf-deep text-center tracking-[0.5em] uppercase">
                Next Generation WebXR • AI Assisted Caddy
            </div>
        </div>
    );
};

export default ARModule;
