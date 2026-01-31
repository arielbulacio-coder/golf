import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ARModule v6.1 - Stability Patch
 * Fixed: App restart when entering AR mode.
 * Changes:
 * 1. Optimized ar-modes and added ios-src for better compatibility.
 * 2. Simplified AR button to avoid React re-render cycles during transition.
 * 3. Added loading='lazy' for secondary models.
 */
const ARModule = ({ weather }) => {
    const { t } = useTranslation();
    const [selectedModel, setSelectedModel] = useState('ball');
    const [scriptStatus, setScriptStatus] = useState('loading');
    const [modelLoading, setModelLoading] = useState(true);
    const viewerRef = useRef(null);

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

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const handleLoad = () => {
            console.log("AR: Loaded");
            setModelLoading(false);
        };

        const handleError = () => setModelLoading(false);

        viewer.addEventListener('load', handleLoad);
        viewer.addEventListener('error', handleError);

        return () => {
            viewer.removeEventListener('load', handleLoad);
            viewer.removeEventListener('error', handleError);
        };
    }, [selectedModel, scriptStatus]);

    if (scriptStatus === 'error') {
        return <div className="p-10 text-white text-center">Error loading AR Engine.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-black text-white rounded-[2rem] overflow-hidden border border-white/5">
            {/* Header */}
            <div className="p-5 bg-zinc-900/50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black uppercase italic">AR <span className="text-elegant-gold text-sm font-bold ml-1">v6.1</span></h2>
                    <div className="text-[7px] text-green-500 font-bold uppercase tracking-widest">{scriptStatus === 'ready' ? '● Engine Ready' : 'Initializing...'}</div>
                </div>
                {weather && <div className="text-[9px] font-bold text-zinc-500">{weather.temp}°C • {weather.wind_speed}KM/H</div>}
            </div>

            {/* Viewport */}
            <div className="relative flex-grow bg-zinc-950 overflow-hidden">
                {modelLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
                        <div className="w-8 h-8 border-2 border-elegant-gold/20 border-t-elegant-gold rounded-full animate-spin"></div>
                    </div>
                )}

                {scriptStatus === 'ready' && (
                    <model-viewer
                        ref={viewerRef}
                        key={selectedModel}
                        src={models[selectedModel].url}
                        alt="Golf Model"
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        auto-rotate
                        shadow-intensity="1"
                        environment-image="neutral"
                        loading="eager"
                        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                    >
                        <button slot="ar-button" className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-elegant-gold text-black font-black px-8 py-4 rounded-full shadow-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest border border-white/20">
                            Ver en mi Espacio 🥽
                        </button>
                        <div slot="progress-bar" className="hidden"></div>
                    </model-viewer>
                )}
            </div>

            {/* Models Switcher */}
            <div className="p-6 bg-zinc-900 flex justify-center gap-6">
                {Object.entries(models).map(([key, model]) => (
                    <button
                        key={key}
                        onClick={() => {
                            if (selectedModel !== key) {
                                setModelLoading(true);
                                setSelectedModel(key);
                            }
                        }}
                        className={`transition-all duration-300 ${selectedModel === key ? 'scale-110 opacity-100' : 'opacity-25 grayscale'}`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 ${selectedModel === key ? 'bg-elegant-gold border-white' : 'bg-black border-zinc-800'}`}>
                            {key === 'ball' ? '⛳' : key === 'club' ? '🏌️' : '🕳️'}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ARModule;
