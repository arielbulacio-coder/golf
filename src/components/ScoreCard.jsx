import React from 'react';
import { useTranslation } from 'react-i18next';

const ScoreCard = ({ players, holes, scores, currentHole }) => {
    const { t } = useTranslation();

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-golf-light">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="bg-golf-deep text-white">
                        <th className="px-2 py-2 text-left">{t('hole.title')}</th>
                        {holes.map(hole => (
                            <th key={hole.number} className={`px-2 py-2 text-center ${currentHole === hole.number ? 'bg-golf-accent text-golf-deep font-bold' : ''}`}>
                                {hole.number}
                            </th>
                        ))}
                        <th className="px-2 py-2 text-center font-bold">Total</th>
                    </tr>
                    <tr className="bg-golf/20 text-golf-dark">
                        <th className="px-2 py-1 text-left">{t('hole.par')}</th>
                        {holes.map(hole => (
                            <th key={`par-${hole.number}`} className="px-2 py-1 text-center">{hole.par}</th>
                        ))}
                        <th className="px-2 py-1 text-center">{holes.reduce((a, b) => a + b.par, 0)}</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map(player => {
                        const playerScores = scores[player.id] || {};
                        const totalScore = Object.values(playerScores).reduce((a, b) => a + (b || 0), 0);

                        return (
                            <tr key={player.id} className="border-b hover:bg-golf-light/30 transition-colors">
                                <td className="px-2 py-3 font-medium text-golf-deep">{player.name} <span className="text-xs text-gray-500">({player.handicap})</span></td>
                                {holes.map(hole => (
                                    <td key={hole.number} className="px-2 py-3 text-center border-l border-gray-100">
                                        {playerScores[hole.number] || '-'}
                                    </td>
                                ))}
                                <td className="px-2 py-3 text-center font-bold text-golf-deep">{totalScore}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ScoreCard;
