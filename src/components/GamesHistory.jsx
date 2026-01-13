import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const GamesHistory = () => {
    const { t } = useTranslation();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = () => {
        // Always load local games first or combined? For now, if on github, only local.
        if (window.location.hostname.includes('github.io')) {
            const localGames = JSON.parse(localStorage.getItem('golf_games_history') || '[]');
            setGames(localGames.sort((a, b) => b.id - a.id));
            setLoading(false);
            return;
        }

        fetch(`${API_URL}/api/games`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    // Start with server games
                    let allGames = data.data;
                    // Add local ones if any (that aren't synced) - simple concat for now
                    const localGames = JSON.parse(localStorage.getItem('golf_games_history') || '[]');
                    // Avoid duplicates if IDs conflict (unlikely with Timestamp vs Int ID, but good to be safe)
                    /* logic could be improved here to sync */
                    setGames([...allGames, ...localGames].sort((a, b) => new Date(b.date) - new Date(a.date)));
                } else {
                    const localGames = JSON.parse(localStorage.getItem('golf_games_history') || '[]');
                    setGames(localGames);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Could not fetch games", err);
                // Fallback to local
                const localGames = JSON.parse(localStorage.getItem('golf_games_history') || '[]');
                setGames(localGames);
                setLoading(false);
            });
    };

    const handleDeleteGame = (id) => {
        if (!window.confirm(t('history.confirmDelete'))) return;

        if (window.location.hostname.includes('github.io')) {
            const localGames = JSON.parse(localStorage.getItem('golf_games_history') || '[]');
            const updated = localGames.filter(g => g.id !== id);
            localStorage.setItem('golf_games_history', JSON.stringify(updated));
            fetchGames();
            return;
        }

        // Try backend delete
        fetch(`${API_URL}/api/games/${id}`, { method: 'DELETE' })
            .then(() => {
                fetchGames();
            })
            .catch(() => {
                // Try local delete if found
                const localGames = JSON.parse(localStorage.getItem('golf_games_history') || '[]');
                const updated = localGames.filter(g => g.id !== id);
                localStorage.setItem('golf_games_history', JSON.stringify(updated));
                fetchGames();
            });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
    };

    const getWinnerName = (scoresJson) => {
        try {
            const scores = JSON.parse(scoresJson);
            // This is simplified, just showing raw scores or player IDs if we don't have player names mapped here
            // In a ideal world we'd join with players table, but for now let's just show "Game ID" or count
            return Object.keys(scores).length + " Players";
        } catch (e) {
            return "Unknown";
        }
    };

    if (loading) return <div className="p-8 text-center">Loading history...</div>;

    return (
        <div className="p-4 max-w-2xl mx-auto animate-fade-in-up">
            <h2 className="text-2xl font-bold text-golf-deep mb-6 text-center">📜 {t('history.title')}</h2>

            {games.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-xl shadow">
                    <p className="text-gray-500">{t('history.noGames')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {games.map(game => (
                        <div key={game.id} className="bg-white p-4 rounded-xl shadow border-l-4 border-golf-accent flex justify-between items-center">
                            <div>
                                <div className="font-bold text-lg text-golf-deep">{game.course_id.replace(/-/g, ' ').toUpperCase()}</div>
                                <div className="text-xs text-gray-500">{formatDate(game.date)}</div>
                                <div className="text-sm mt-1">{getWinnerName(game.scores)} - Scored</div>
                            </div>
                            <button
                                onClick={() => handleDeleteGame(game.id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GamesHistory;
