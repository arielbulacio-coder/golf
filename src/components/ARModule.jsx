import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ARModule v5.0 - Ultra Compatible & Robust Edition
 * Features:
 * 1. Safe Script Loading with timeout
 * 2. Proper path handling for GitHub Pages
 * 3. Base64 Fallback support (omitted for size, using robust paths)
 */
const ARModule = ({ weather }) => {
    const { t } = useTranslation();
    const [selectedModel, setSelectedModel] = useState('ball');
    const [scriptStatus, setScriptStatus] = useState('loading'); // loading, ready, error
    const [modelLoading, setModelLoading] = useState(true);

    // GitHub Pages path helper
    const getAssetPath = (path) => {
        const isGH = window.location.hostname.includes('github.io');
        const base = isGH ? '/golf' : '';
        return `${base}${path.startsWith('.') ? path.substring(1) : path}`;
    };

    const models = {
        ball: {
            url: getAssetPath('./models/ball.glb'),
            name: t('ar.ball'),
            description: 'Esfera profesional de alta precisión.'
        },
        club: {
            url: getAssetPath('./models/club.glb'),
            name: t('ar.club'),
            description: 'Análisis de diseño y ergonomía.'
        },
        hole: {
            url: getAssetPath('./models/hole.glb'),
            name: t('ar.hole'),
            description: 'Referencia visual para entrenamiento.'
        }
    };

    useEffect(() => {
        const scriptId = 'model-viewer-script';
        let script = document.getElementById(scriptId);

        const onScriptLoad = () => {
            console.log("AR Engine: Script Loaded");
            setScriptStatus('ready');
        };

        const onScriptError = () => {
            console.error("AR Engine: Script Load Error");
            setScriptStatus('error');
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'module';
            // Use a specific version for better compatibility
            script.src = 'https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js';
            script.async = true;
            script.onload = onScriptLoad;
            script.onerror = onScriptError;
            document.head.appendChild(script);
        } else {
            // Script already exists, check if custom element is defined
            if (window.customElements && window.customElements.get('model-viewer')) {
                setScriptStatus('ready');
            } else {
                script.addEventListener('load', onScriptLoad);
                script.addEventListener('error', onScriptError);
            }
        }

        // Safety timeout for UI
        const timer = setTimeout(() => {
            if (window.customElements && window.customElements.get('model-viewer')) {
                setScriptStatus('ready');
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleModelLoad = () => {
        console.log("AR Engine: Model Loaded");
        setModelLoading(false);
    };

    if (scriptStatus === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8 text-center">
                <div className="text-4xl mb-4">🚫</div>
                <h3 className="text-lg font-bold">Error de Motor</h3>
                <p className="text-xs text-gray-400 mt-2 italic">No se pudo cargar el motor WebXR.</p>
                <button onClick={() => window.location.reload()} className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up flex flex-col h-full bg-black text-white rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            {/* Minimal Header */}
            <div className="p-4 bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black tracking-tighter text-white uppercase italic">
                        {t('ar.title')} <span className="text-elegant-gold">Pro</span>
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${scriptStatus === 'ready' ? 'bg-green-500 animate-pulse' : 'bg-orange-500 animate-bounce'}`}></div>
                        <span className="text-[7px] font-black tracking-[0.2em] text-zinc-500 uppercase">
                            {scriptStatus === 'ready' ? 'Engine Ready' : 'Initializing Engine'}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] font-mono text-zinc-600">v5.0.0-Stable</div>
                    {weather && <div className="text-[8px] text-zinc-400 mt-0.5">{weather.temp}° • {weather.wind_speed}km/h</div>}
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative flex-grow bg-radial-gradient from-zinc-800 to-black overflow-hidden group">
                {/* Loader Overlay */}
                {(scriptStatus === 'loading' || modelLoading) && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500">
                        <div className="w-8 h-8 border-2 border-elegant-gold/30 border-t-elegant-gold rounded-full animate-spin"></div>
                        <p className="mt-4 text-[8px] font-black tracking-[0.4em] text-elegant-gold animate-pulse uppercase">
                            {scriptStatus === 'loading' ? 'Sincronizando Motor' : 'Procesando Modelo 3D'}
                        </p>
                    </div>
                )}

                {scriptStatus === 'ready' && (
                    <model-viewer
                        key={selectedModel}
                        src={models[selectedModel].url}
                        alt="Golf Equipment 3D"
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        auto-rotate
                        shadow-intensity="1"
                        loading="eager"
                        poster={getAssetPath('./icon.png')}
                        onLoad={handleModelLoad}
                        style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
                    >
                        <button slot="ar-button" className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-elegant-gold text-black font-black px-8 py-3.5 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center gap-2 translate-z-10 active:scale-95 transition-all text-xs border border-white/20">
                            <span>🥽</span> {t('ar.viewInSpace').toUpperCase()}
                        </button>

                        <div slot="progress-bar" className="hidden"></div>
                    </model-viewer>
                )}

                {/* Floating Info */}
                <div className="absolute top-4 left-4 right-4 pointer-events-none z-10">
                    <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 inline-block">
                        <h4 className="text-[10px] font-black text-elegant-gold uppercase tracking-widest">{models[selectedModel].name}</h4>
                        <p className="text-[8px] text-zinc-400 mt-1 leading-tight max-w-[120px]">{models[selectedModel].description}</p>
                    </div>
                </div>
            </div>

            {/* Footer Control Bar */}
            <div className="p-4 bg-zinc-900 border-t border-white/5">
                <div className="flex justify-center gap-4">
                    {Object.entries(models).map(([key, model]) => (
                        <button
                            key={key}
                            onClick={() => {
                                setModelLoading(true);
                                setSelectedModel(key);
                            }}
                            className={`flex flex-col items-center transition-all duration-300 ${selectedModel === key ? 'scale-110' : 'opacity-20 hover:opacity-100 grayscale'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-1 border-2 transition-colors ${selectedModel === key ? 'bg-elegant-gold border-white' : 'bg-zinc-800 border-zinc-700'
                                }`}>
                                {key === 'ball' ? '⛳' : key === 'club' ? '🏌️' : '🕳️'}
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-tighter text-zinc-500">
                                {model.name.split(' ')[0]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ARModule;
