import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PlayersManager = ({ onSelectPlayer, scoringType, onSetScoringType }) => {
    const { t } = useTranslation();
    const [players, setPlayers] = useState([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerHandicap, setNewPlayerHandicap] = useState('');
    const [status, setStatus] = useState('');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = () => {
        fetch(`${API_URL}/api/players`)
            .then(res => res.json())
            .then(data => {
                if (data.data) setPlayers(data.data);
            })
            .catch(err => console.error("Could not fetch players", err));
    };

    const handleAddPlayer = () => {
        if (!newPlayerName || !newPlayerHandicap) return;

        const payload = {
            name: newPlayerName,
            handicap: parseInt(newPlayerHandicap),
            type: parseInt(newPlayerHandicap) < 10 ? 'Professional' : 'Beginner'
        };

        fetch(`${API_URL}/api/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(() => {
                setNewPlayerName('');
                setNewPlayerHandicap('');
                fetchPlayers();
                setStatus('Player added!');
                setTimeout(() => setStatus(''), 3000);
            })
            .catch(err => setStatus('Error adding player'));
    };

    const handleDeletePlayer = (id) => {
        if (!window.confirm(t('players.confirmDelete'))) return;

        fetch(`${API_URL}/api/players/${id}`, {
            method: 'DELETE'
        })
            .then(() => {
                fetchPlayers();
                setStatus('Player deleted');
                setTimeout(() => setStatus(''), 3000);
            })
            .catch(err => setStatus('Error deleting player'));
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-golf-deep mb-4">⛳ {t('players.title')}</h2>

            {onSetScoringType && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-bold uppercase text-blue-500 mb-2">{t('scoring.title')}</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onSetScoringType('stroke_net')}
                            className={`flex-1 py-2 text-xs font-bold rounded ${scoringType === 'stroke_net' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
                        >
                            {t('scoring.strokeNet')}
                        </button>
                        <button
                            onClick={() => onSetScoringType('stableford')}
                            className={`flex-1 py-2 text-xs font-bold rounded ${scoringType === 'stableford' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
                        >
                            {t('scoring.stableford')}
                        </button>
                        <button
                            onClick={() => onSetScoringType('scratch')}
                            className={`flex-1 py-2 text-xs font-bold rounded ${scoringType === 'scratch' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
                        >
                            {t('scoring.scratch')}
                        </button>
                    </div>
                    <div className="mt-2 p-2 bg-white/50 text-xs text-blue-800 rounded">
                        {scoringType === 'stroke_net' && t('scoring.descStrokeNet')}
                        {scoringType === 'stableford' && t('scoring.descStableford')}
                        {scoringType === 'scratch' && t('scoring.descScratch')}
                    </div>
                </div>
            )}

            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">{t('players.newPlayer')}</h3>
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        placeholder={t('players.fullName')}
                        className="p-2 border rounded"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder={t('hole.handicap')}
                        className="p-2 border rounded"
                        value={newPlayerHandicap}
                        onChange={(e) => setNewPlayerHandicap(e.target.value)}
                    />
                    <button
                        onClick={handleAddPlayer}
                        className="bg-golf-deep text-white py-2 rounded font-bold hover:bg-golf-dark transition"
                    >
                        {t('players.addPlayer')}
                    </button>
                    {status && <p className="text-green-600 text-sm text-center">{status}</p>}
                </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">{t('players.registeredPlayers')}</h3>
                {players.length === 0 && <p className="text-gray-400 text-sm">{t('players.noPlayers')}</p>}
                {players.map(player => (
                    <div key={player.id} className="flex justify-between items-center p-3 bg-white border rounded hover:shadow-md transition">
                        <div>
                            <div className="font-bold text-gray-800">{player.name}</div>
                            <div className="text-xs text-gray-500">HCP: {player.handicap} • {t(`playerType.${player.type}`, player.type)}</div>
                        </div>
                        <div className="flex gap-2">
                            {onSelectPlayer && (
                                <button onClick={() => onSelectPlayer(player)} className="text-xs bg-golf-deep text-white px-2 py-1 rounded">
                                    {t('players.select')}
                                </button>
                            )}
                            <button onClick={() => handleDeletePlayer(player.id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
};

export default PlayersManager;
