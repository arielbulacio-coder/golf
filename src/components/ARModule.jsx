import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ARModule = () => {
    const { t } = useTranslation();
    const [selectedModel, setSelectedModel] = useState('ball');

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

    return (
        <div className="animate-fade-in-up flex flex-col h-full bg-gradient-to-b from-gray-900 to-black text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            {/* Header */}
            <div className="p-6 bg-white/5 backdrop-blur-md border-b border-white/10 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-elegant-gold to-yellow-200 bg-clip-text text-transparent italic">
                        {t('ar.title')}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest uppercase tracking-widest">SISTEMA AR ACTIVO</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-500 font-mono italic opacity-50">AR Engine v4.0</span>
                </div>
            </div>

            {/* 3D Viewer Area */}
            <div className="relative flex-grow bg-black/40 group overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

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
                    style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                >
                    <button slot="ar-button" className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-elegant-gold to-yellow-500 text-golf-deep font-black px-10 py-5 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border-2 border-white/20 whitespace-nowrap">
                        <span className="text-xl">🥽</span> {t('ar.viewInSpace').toUpperCase()}
                    </button>

                    {/* Custom AR Loading Progress */}
                    <div slot="progress-bar" className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 transition-opacity duration-300">
                        <div className="flex flex-col items-center text-center p-6">
                            <div className="w-16 h-16 border-4 border-elegant-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-elegant-gold font-bold tracking-[0.3em] animate-pulse text-xs">INICIALIZANDO MOTOR AR...</p>
                        </div>
                    </div>
                </model-viewer>

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
