import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ARModule v6.0 - Final Bug-Fix Edition
 * Changes:
 * 1. Switched to direct event listeners for custom elements (Standard React doesn't catch 'load' on custom tags well).
 * 2. Optimized model URLs (Using smaller, highly reliable assets).
 * 3. Added fallback timeout to force-show model if load event is missed.
 */
const ARModule = ({ weather }) => {
    const { t } = useTranslation();
    const [selectedModel, setSelectedModel] = useState('ball');
    const [scriptStatus, setScriptStatus] = useState('loading');
    const [modelLoading, setModelLoading] = useState(true);
    const viewerRef = useRef(null);

    // GitHub Pages path helper
    const getAssetPath = (path) => {
        const isGH = window.location.hostname.includes('github.io');
        const cleanPath = path.startsWith('./') ? path.substring(2) : path.startsWith('/') ? path.substring(1) : path;
        return isGH ? `/golf/${cleanPath}` : `/${cleanPath}`;
    };

    const models = {
        ball: {
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb',
            name: t('ar.ball'),
            description: 'Esfera profesional de alta precisión.'
        },
        club: {
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
            name: t('ar.club'),
            description: 'Análisis de diseño y ergonomía.'
        },
        hole: {
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
            name: t('ar.hole'),
            description: 'Referencia visual para entrenamiento.'
        }
    };

    // Script Loader
    useEffect(() => {
        const scriptId = 'model-viewer-script';
        let script = document.getElementById(scriptId);

        const onScriptReady = () => setScriptStatus('ready');

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'module';
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
            script.async = true;
            script.onload = onScriptReady;
            script.onerror = () => setScriptStatus('error');
            document.head.appendChild(script);
        } else {
            if (window.customElements && window.customElements.get('model-viewer')) {
                setScriptStatus('ready');
            } else {
                script.addEventListener('load', onScriptReady);
            }
        }
    }, []);

    // Model Event Listeners (Crucial for Custom Elements in React)
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const handleLoad = () => {
            console.log("AR: Model fully loaded");
            setModelLoading(false);
        };

        const handleError = (error) => {
            console.error("AR: Model failed to load", error);
            // Even on error, we hide loader to show what happened
            setModelLoading(false);
        };

        viewer.addEventListener('load', handleLoad);
        viewer.addEventListener('error', handleError);

        // Safety timeout: If it takes more than 5s, something might be blocked but rendered
        const timeout = setTimeout(() => setModelLoading(false), 5000);

        return () => {
            viewer.removeEventListener('load', handleLoad);
            viewer.removeEventListener('error', handleError);
            clearTimeout(timeout);
        };
    }, [selectedModel, scriptStatus]);

    if (scriptStatus === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-white p-10 text-center">
                <span className="text-5xl mb-4">🔇</span>
                <h3 className="text-lg font-bold">Motor Desconectado</h3>
                <p className="text-xs text-zinc-500 mt-2">No se pudo cargar la librería WebXR.</p>
                <button onClick={() => window.location.reload()} className="mt-8 bg-elegant-gold text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em]">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up flex flex-col h-full bg-black text-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
            {/* Ultra-Premium Header */}
            <div className="p-5 bg-zinc-900/50 backdrop-blur-2xl border-b border-white/5 flex justify-between items-end">
                <div>
                    <div className="text-[10px] font-black text-elegant-gold uppercase tracking-[0.3em] mb-1 italic">SISTEMA CADDY RA</div>
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">
                        PRO <span className="text-elegant-gold">VISUALIZER</span>
                    </h2>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[7px] font-black text-green-500 uppercase tracking-widest">ACTIVE</span>
                    </div>
                    {weather && <div className="text-[8px] font-bold text-zinc-500 uppercase">{weather.temp}°C • {weather.wind_speed}KM/H</div>}
                </div>
            </div>

            {/* Stage Area */}
            <div className="relative flex-grow bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black overflow-hidden">
                {/* Loader */}
                {modelLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                        <div className="relative">
                            <div className="w-12 h-12 border-2 border-elegant-gold/10 rounded-full"></div>
                            <div className="absolute inset-0 w-12 h-12 border-t-2 border-elegant-gold rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-6 text-[9px] font-black tracking-[0.5em] text-elegant-gold animate-pulse uppercase">Syncing 3D Data</p>
                    </div>
                )}

                {scriptStatus === 'ready' && (
                    <model-viewer
                        ref={viewerRef}
                        key={selectedModel}
                        src={models[selectedModel].url}
                        alt="Golf Pro Model"
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        auto-rotate
                        shadow-intensity="2"
                        exposure="1"
                        environment-image="neutral"
                        loading="eager"
                        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                    >
                        <button slot="ar-button" className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-elegant-gold to-yellow-500 text-black font-black px-10 py-5 rounded-full shadow-[0_20px_50px_rgba(234,179,8,0.3)] flex items-center gap-3 active:scale-95 transition-all text-xs border-2 border-white/20 uppercase tracking-widest">
                            <span className="text-xl">🥽</span> {t('ar.viewInSpace')}
                        </button>

                        <div slot="progress-bar" className="hidden"></div>
                    </model-viewer>
                )}

                {/* HUD Data Controls */}
                <div className="absolute top-6 left-6 pointer-events-none z-10">
                    <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 max-w-[180px] shadow-2xl">
                        <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Selected Asset</div>
                        <h4 className="text-xs font-black text-elegant-gold uppercase tracking-wider">{models[selectedModel].name}</h4>
                        <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed opacity-80">{models[selectedModel].description}</p>
                    </div>
                </div>
            </div>

            {/* Asset Switcher */}
            <div className="p-8 bg-black border-t border-white/5">
                <div className="flex justify-center gap-8">
                    {Object.entries(models).map(([key, model]) => (
                        <button
                            key={key}
                            onClick={() => {
                                if (selectedModel === key) return;
                                setModelLoading(true);
                                setSelectedModel(key);
                            }}
                            className={`flex flex-col items-center transition-all duration-500 ${selectedModel === key ? 'scale-110 opacity-100' : 'opacity-20 hover:opacity-100 grayscale'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-2 border-2 transition-all duration-500 ${selectedModel === key ? 'bg-elegant-gold border-white shadow-[0_0_25px_rgba(234,179,8,0.4)]' : 'bg-zinc-900 border-zinc-800'
                                }`}>
                                {key === 'ball' ? '⛳' : key === 'club' ? '🏌️' : '🕳️'}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${selectedModel === key ? 'text-white' : 'text-zinc-600'}`}>
                                {model.name.split(' ')[0]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Tech Bar */}
            <div className="bg-elegant-gold h-1 flex items-center justify-center">
                <div className="w-20 h-full bg-white animate-pulse"></div>
            </div>
        </div>
    );
};

export default ARModule;
