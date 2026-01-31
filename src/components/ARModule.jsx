import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ARModule = ({ weather }) => {
    const { t } = useTranslation();
    const [selectedModel, setSelectedModel] = useState('ball');
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);

    // Dynamic models with reliable URLs
    const models = {
        ball: {
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb',
            name: t('ar.ball'),
            description: 'Esfera profesional de alta precisión para práctica de alineamiento.'
        },
        club: {
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb', // Reliably small model for testing
            name: t('ar.club'),
            description: 'Análisis de diseño y ergonomía en 3D.'
        },
        hole: {
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
            name: t('ar.hole'),
            description: 'Punto de referencia visual para entrenamiento de putt.'
        }
    };

    useEffect(() => {
        const scriptId = 'model-viewer-script';
        let script = document.getElementById(scriptId);

        const checkLoaded = () => {
            if (window.customElements && window.customElements.get('model-viewer')) {
                setScriptLoaded(true);
                return true;
            }
            return false;
        };

        if (checkLoaded()) return;

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'module';
            script.src = 'https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js';
            script.async = true;

            script.onload = () => {
                setTimeout(checkLoaded, 500);
            };

            script.onerror = () => {
                setLoadError(true);
            };

            document.head.appendChild(script);
        } else {
            const interval = setInterval(() => {
                if (checkLoaded()) clearInterval(interval);
            }, 500);
            return () => clearInterval(interval);
        }
    }, []);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8 text-center text-sm">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-2">Error de Motor</h2>
                <p className="text-gray-400 mb-4">No se pudo inicializar el sistema de Realidad Aumentada.</p>
                <button onClick={() => window.location.reload()} className="bg-elegant-gold text-golf-deep font-black px-6 py-2 rounded-full text-xs uppercase">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up flex flex-col h-full bg-gradient-to-b from-gray-900 to-black text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            {/* Header */}
            <div className="p-4 bg-white/5 backdrop-blur-md border-b border-white/10 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-elegant-gold to-yellow-200 bg-clip-text text-transparent italic leading-tight">
                        {t('ar.title')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${scriptLoaded ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-bounce'}`}></span>
                        <p className="text-[8px] font-bold text-green-400 uppercase tracking-widest">
                            {scriptLoaded ? 'SISTEMA READY' : 'CONECTANDO...'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-mono italic opacity-50 block leading-none mb-1">AR ENGINE v4.1</span>
                    {weather && <span className="text-[9px] text-gray-400 leading-none">{weather.temp}° • {weather.wind_speed}km/h</span>}
                </div>
            </div>

            {/* 3D Viewer Area */}
            <div className="relative flex-grow bg-black/40 group overflow-hidden">
                {!scriptLoaded ? (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-2 border-elegant-gold border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-elegant-gold font-bold text-[9px] tracking-[0.3em] animate-pulse">BOOTING ENGINE...</p>
                        </div>
                    </div>
                ) : (
                    <model-viewer
                        key={selectedModel}
                        src={models[selectedModel].url}
                        alt="Golf Equipment 3D Model"
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        auto-rotate
                        shadow-intensity="1.5"
                        曝光="1.2"
                        environment-image="neutral"
                        loading="eager"
                        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                    >
                        <button slot="ar-button" className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-elegant-gold to-yellow-500 text-golf-deep font-black px-8 py-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20 whitespace-nowrap text-xs">
                            <span className="text-lg">🥽</span> {t('ar.viewInSpace').toUpperCase()}
                        </button>

                        <div slot="progress-bar" className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
                            <div className="flex flex-col items-center text-center p-6">
                                <div className="w-12 h-12 border-2 border-elegant-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-elegant-gold font-bold tracking-[0.2em] animate-pulse text-[10px] uppercase">Descargando Modelo 3D...</p>
                                <p className="text-gray-500 text-[8px] mt-2 uppercase tracking-widest">{models[selectedModel].name}</p>
                            </div>
                        </div>
                    </model-viewer>
                )}

                {/* Floating Info Card */}
                <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-xl p-3 rounded-xl border border-white/10 max-w-[150px]">
                        <h3 className="font-black text-elegant-gold text-[10px] mb-0.5 uppercase tracking-tighter">{models[selectedModel].name}</h3>
                        <p className="text-[8px] text-gray-400 leading-tight line-clamp-2">{models[selectedModel].description}</p>
                    </div>
                </div>
            </div>

            {/* Model Selector Bar */}
            <div className="p-4 bg-black/80 backdrop-blur-2xl border-t border-white/10">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                    {Object.entries(models).map(([key, model]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedModel(key)}
                            className={`flex-shrink-0 relative transition-all duration-300 ${selectedModel === key ? 'scale-105' : 'opacity-30 hover:opacity-70'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-1 border transition-all ${selectedModel === key
                                    ? 'bg-elegant-gold border-white shadow-lg'
                                    : 'bg-white/5 border-white/10'
                                }`}>
                                {key === 'ball' ? '⛳' : key === 'club' ? '🏌️' : '🕳️'}
                            </div>
                            <div className={`text-[8px] font-black text-center uppercase tracking-tighter ${selectedModel === key ? 'text-elegant-gold' : 'text-gray-500'}`}>
                                {model.name.split(' ')[0]}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-elegant-gold p-0.5 text-[7px] font-black text-golf-deep text-center tracking-[0.4em] uppercase">
                Premium WebXR Integration
            </div>
        </div>
    );
};

export default ARModule;
