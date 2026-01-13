import React from 'react';

const rules = [
    {
        title: "1. El Juego",
        content: "El golf se juega golpeando una bola con un palo desde el área de salida hasta el hoyo mediante un golpe o golpes sucesivos de acuerdo con las Reglas."
    },
    {
        title: "2. Área de Salida (Tee)",
        content: "Debes jugar tu bola desde dentro del área de salida. Puedes usar un tee o jugar la bola desde el suelo."
    },
    {
        title: "3. Jugar la Bola",
        content: "Juega la bola como repose. No puedes mejorar tu lie (posición de la bola), el área de tu stance o swing, o tu línea de juego moviendo, doblando o rompiendo nada fijo o en crecimiento."
    },
    {
        title: "4. En el Green",
        content: "Puedes marcar, levantar y limpiar tu bola en el green. Siempre vuelve a colocarla en el punto exacto."
    },
    {
        title: "5. Bola Perdida o Fuera de Límites",
        content: "Si tu bola está perdida o fuera de límites, debes jugar otra bola desde donde jugaste el último golpe con una penalización de un golpe (Golpe y Distancia)."
    },
    {
        title: "6. Área de Penalización (Agua)",
        content: "Si tu bola está en un área de penalización (marcada con estacas rojas o amarillas), puedes jugarla como reposa o tomar alivio con un golpe de penalización."
    },
    {
        title: "7. Puntuación",
        content: "Tu puntuación para cada hoyo es el número total de golpes que realizaste más cualquier golpe de penalización."
    }
];

const GolfRules = () => {
    return (
        <div className="animate-fade-in-up pb-24">
            <h2 className="text-2xl font-bold text-golf-deep mb-6 text-center">📜 Reglas Básicas del Golf</h2>
            <div className="space-y-4">
                {rules.map((rule, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-golf-deep hover:shadow-lg transition">
                        <h3 className="font-bold text-lg text-golf-deep mb-2">{rule.title}</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {rule.content}
                        </p>
                    </div>
                ))}
            </div>
            <div className="mt-8 p-4 bg-golf-light/50 rounded-lg text-center text-xs text-gray-500">
                * Estas son reglas simplificadas para principiantes. Consulta el libro oficial de la R&A o USGA para torneos.
            </div>
        </div>
    );
};

export default GolfRules;
