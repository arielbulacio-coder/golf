import React, { useState } from 'react';

const clubsData = [
    {
        category: "Maderas (Woods)",
        items: [
            { name: "Driver (1 Wood)", distances: "200-280+ yardas", desc: "El palo más largo y con la cabeza más grande. Se usa para el golpe de salida (Tee shot) en hoyos largos (Par 4 y 5) para lograr la máxima distancia." },
            { name: "Maderas de Calle (3, 5 Wood)", distances: "170-240 yardas", desc: "Se usan para golpes largos desde el fairway o desde el tee cuando se necesita más precisión que con el driver." }
        ]
    },
    {
        category: "Híbridos (Hybrids)",
        items: [
            { name: "Híbridos (3H, 4H, 5H)", distances: "150-210 yardas", desc: "Combinan características de maderas y hierros. Son más fáciles de golpear que los hierros largos y levantan más la bola. Ideales para salir del rough." }
        ]
    },
    {
        category: "Hierros (Irons)",
        items: [
            { name: "Hierros Largos (3-4)", distances: "170-200 yardas", desc: "Difíciles de controlar, vuelo bajo. Muchos jugadores los reemplazan por híbridos." },
            { name: "Hierros Medios (5-6-7)", distances: "130-170 yardas", desc: "Palos versátiles para aproximaciones al green desde distancias medias. El Hierro 7 es el palo estándar para practicar." },
            { name: "Hierros Cortos (8-9)", distances: "100-140 yardas", desc: "Para tiros precisos al green. Vuelo alto y poco rodamiento al caer." }
        ]
    },
    {
        category: "Wedges",
        items: [
            { name: "Pitching Wedge (PW)", distances: "90-120 yardas", desc: "Para tiros de aproximación o chips largos alrededor del green." },
            { name: "Sand Wedge (SW)", distances: "60-90 yardas", desc: "Diseñado con una base ancha (bounce) para sacar la bola de los búnkers de arena, y para tiros altos y cortos." },
            { name: "Lob Wedge (LW)", distances: "40-70 yardas", desc: "Vuelo muy alto y parada rápida. Para tiros delicados por encima de obstáculos." }
        ]
    },
    {
        category: "Putter",
        items: [
            { name: "Putter", distances: "En el Green", desc: "El palo más utilizado. Diseñado para hacer rodar la bola por el suelo hacia el hoyo. Se usa en el green o muy cerca de él." }
        ]
    }
];

const GolfClubs = () => {
    const [activeCategory, setActiveCategory] = useState(null);

    const toggleCategory = (index) => {
        setActiveCategory(activeCategory === index ? null : index);
    };

    return (
        <div className="animate-fade-in-up pb-24">
            <h2 className="text-2xl font-bold text-golf-deep mb-6 text-center">🎒 Equipamiento de Golf</h2>

            <div className="space-y-4">
                {clubsData.map((cat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
                        <button
                            className={`w-full text-left p-4 font-bold flex justify-between items-center ${activeCategory === index ? 'bg-golf-deep text-white' : 'bg-white text-golf-deep hover:bg-gray-50'}`}
                            onClick={() => toggleCategory(index)}
                        >
                            <span>{cat.category}</span>
                            <span>{activeCategory === index ? '▲' : '▼'}</span>
                        </button>

                        {activeCategory === index && (
                            <div className="p-4 bg-gray-50 space-y-4 animate-fade-in">
                                {cat.items.map((club, idx) => (
                                    <div key={idx} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                                        <h4 className="font-bold text-lg text-golf-dark">{club.name}</h4>
                                        <div className="flex items-center gap-2 my-1">
                                            <span className="text-xs font-bold px-2 py-0.5 bg-golf-accent text-golf-deep rounded-full">Distancia: {club.distances}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">{club.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GolfClubs;
