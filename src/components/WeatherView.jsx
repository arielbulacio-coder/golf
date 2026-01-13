import React from 'react';
import { useTranslation } from 'react-i18next';

const WeatherView = ({ weather }) => {
    const { t } = useTranslation();

    if (!weather) {
        return <div className="text-center p-10 text-gray-500">Loading Weather...</div>;
    }

    const { temp, wind_speed, wind_dir, daily, hourly, description } = weather;
    // Extract code from description string "Weather Code X" or passed directly
    const weatherCode = parseInt(description.split(' ')[2]) || 0;

    const getWeatherIcon = (code) => {
        // WMO Weather interpretation codes (WW)
        if (code === 0) return '☀️'; // Clear sky
        if (code >= 1 && code <= 3) return '⛅'; // Mainly clear, partly cloudy, overcast
        if (code >= 45 && code <= 48) return '🌫️'; // Fog
        if (code >= 51 && code <= 67) return '🌧️'; // Drizzle / Rain
        if (code >= 71 && code <= 77) return '❄️'; // Snow
        if (code >= 80 && code <= 82) return '🌦️'; // Rain showers
        if (code >= 95) return '⚡'; // Thunderstorm
        return '❓';
    };

    // Calculate next 24 hours for hourly forecast
    const now = new Date();
    // Safety check for hourly data availability
    const next24Hours = hourly ? hourly.time
        .map((time, i) => ({
            time: time,
            temp: hourly.temperature_2m[i],
            code: hourly.weather_code[i]
        }))
        .filter(item => new Date(item.time) >= now) // Filter for future hours
        .slice(0, 24) : []; // Limit to next 24 hours

    return (
        <div className="animate-fade-in-up p-4 space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold">{t('weather.current')}</h2>
                        <div className="text-5xl font-bold mt-2">{temp}°C</div>
                    </div>
                    <div className="text-6xl">{getWeatherIcon(weatherCode)}</div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-sm opacity-80">{t('hole.wind')}</div>
                        <div className="text-xl font-bold">{wind_speed} km/h</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xl" style={{ display: 'inline-block', transform: `rotate(${wind_dir}deg)` }}>⬇</span>
                            <span className="text-xs">Dir: {wind_dir}°</span>
                        </div>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <div className="text-sm opacity-80">Humedad</div>
                        <div className="text-xl font-bold">{weather.humidity}%</div>
                    </div>
                </div>
            </div>

            {/* Hourly Forecast Section */}
            {next24Hours.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xl font-bold text-golf-deep px-2">Pronóstico por Hora</h3>
                    <div className="flex overflow-x-auto space-x-3 pb-4 px-2 scrollbar-hide">
                        {next24Hours.map((item) => (
                            <div key={item.time} className="flex-shrink-0 w-20 bg-white rounded-xl p-3 flex flex-col items-center shadow-lg border border-gray-100">
                                <span className="text-xs font-bold text-gray-500">
                                    {new Date(item.time).getHours()}:00
                                </span>
                                <span className="text-2xl my-2 drop-shadow-sm">{getWeatherIcon(item.code)}</span>
                                <span className="font-bold text-gray-800 text-lg">{Math.round(item.temp)}°</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h3 className="text-xl font-bold text-golf-deep px-2">{t('weather.forecast')}</h3>

            <div className="space-y-4">
                {daily.time.map((date, index) => (
                    <div key={date} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-md border-l-4 border-golf-accent">
                        <div>
                            <p className="font-bold text-gray-700">{new Date(date).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-500">{t('weather.max')}: {daily.temperature_2m_max[index]}°C / {t('weather.min')}: {daily.temperature_2m_min[index]}°C</p>
                        </div>
                        <div className="text-4xl">{getWeatherIcon(daily.weather_code[index])}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherView;
