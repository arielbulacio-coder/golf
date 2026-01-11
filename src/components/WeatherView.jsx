import React from 'react';
import { useTranslation } from 'react-i18next';

const WeatherView = ({ weather }) => {
    const { t } = useTranslation();

    if (!weather) {
        return <div className="text-center p-10 text-gray-500">Loading Weather...</div>;
    }

    const { current_weather, daily } = weather;

    const getWeatherIcon = (code) => {
        // WMO Weather interpretation codes (WW)
        if (code === 0) return '☀️';
        if (code >= 1 && code <= 3) return 'Vkd';
        if (code >= 45 && code <= 48) return '🌫️';
        if (code >= 51 && code <= 67) return '🌧️';
        if (code >= 71 && code <= 77) return '❄️';
        if (code >= 80 && code <= 82) return '🌦️';
        if (code >= 95) return '⚡';
        return '❓';
    };

    return (
        <div className="animate-fade-in-up p-4 space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold">{t('weather.current')}</h2>
                        <div className="text-5xl font-bold mt-2">{current_weather.temperature}°C</div>
                    </div>
                    <div className="text-6xl">{getWeatherIcon(current_weather.weathercode)}</div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-sm opacity-80">{t('hole.wind')}</div>
                        <div className="text-xl font-bold">{current_weather.windspeed} km/h</div>
                        <div className="text-xs transform" style={{ transform: `rotate(${current_weather.winddirection}deg)` }}>
                            ➤ Direction
                        </div>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-sm opacity-80">Elevation</div>
                        <div className="text-xl font-bold">45m</div>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-golf-deep px-2">{t('weather.forecast')}</h3>

            <div className="space-y-4">
                {daily.time.map((date, index) => (
                    <div key={date} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-md border-l-4 border-golf-accent">
                        <div>
                            <p className="font-bold text-gray-700">{new Date(date).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-500">{t('weather.max')}: {daily.temperature_2m_max[index]}°C / {t('weather.min')}: {daily.temperature_2m_min[index]}°C</p>
                        </div>
                        <div className="text-4xl">{getWeatherIcon(daily.weathercode[index])}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherView;
