import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    es: {
        translation: {
            appTitle: "Golf Caddy AI",
            nav: {
                play: "Jugar",
                scorecard: "Tarjeta",
                credits: "Créditos"
            },
            hole: {
                title: "Hoyo",
                par: "Par",
                handicap: "Hándicap",
                wind: "Viento",
                yards: "Yardas",
                previous: "Anterior",
                next: "Siguiente",
                finish: "Terminar Juego",
                aiSuggestion: "Sugerencia Caddy IA",
                scoring: "Puntaje",
                headwind: "Viento en Contra",
                tailwind: "Viento a Favor"
            },
            results: {
                winner: "¡Ganador!",
                basedOn: "Basado en Score Neto",
                viewScorecard: "Ver Tarjeta Completa"
            },
            credits: {
                title: "Acerca de Golf Caddy AI",
                description: "Esta aplicación es tu compañero inteligente de golf. Utiliza GPS para calcular distancias precisas al green, analiza las condiciones del viento y utiliza Inteligencia Artificial para sugerirte el palo ideal para cada golpe. Lleva el conteo de golpes de múltiples jugadores y calcula el ganador final considerando el hándicap.",
                developer: "Desarrollo por Ariel Bulacio año 2026",
                rights: "todos los derechos reservados"
            },
            playerType: {
                Beginner: "Principiante",
                Professional: "Profesional"
            }
        }
    },
    en: {
        translation: {
            appTitle: "Golf Caddy AI",
            nav: {
                play: "Play",
                scorecard: "Scorecard",
                credits: "Credits"
            },
            hole: {
                title: "Hole",
                par: "Par",
                handicap: "Handicap",
                wind: "Wind",
                yards: "Yards",
                previous: "Previous",
                next: "Next Hole",
                finish: "Finish Game",
                aiSuggestion: "AI Caddy Suggestion",
                scoring: "Scoring",
                headwind: "Headwind",
                tailwind: "Tailwind"
            },
            results: {
                winner: "Winner!",
                basedOn: "Based on Net Score",
                viewScorecard: "View Full Scorecard"
            },
            credits: {
                title: "About Golf Caddy AI",
                description: "This application is your intelligent golf companion. It uses GPS to calculate accurate distances to the green, analyzes wind conditions, and uses Artificial Intelligence to suggest the ideal club for each shot. It tracks strokes for multiple players and calculates the final winner considering handicap.",
                developer: "Developed by Ariel Bulacio year 2026",
                rights: "all rights reserved"
            },
            playerType: {
                Beginner: "Beginner",
                Professional: "Professional"
            }
        }
    },
    zh: {
        translation: {
            appTitle: "高尔夫球童 AI",
            nav: {
                play: "玩",
                scorecard: "记分卡",
                credits: "致谢"
            },
            hole: {
                title: "洞",
                par: "标准杆",
                handicap: "差点",
                wind: "风",
                yards: "码",
                previous: "上一洞",
                next: "下一洞",
                finish: "完成游戏",
                aiSuggestion: "AI 球童建议",
                scoring: "计分",
                headwind: "顶风",
                tailwind: "顺风"
            },
            results: {
                winner: "获胜者!",
                basedOn: "基于净分",
                viewScorecard: "查看完整记分卡"
            },
            credits: {
                title: "关于高尔夫球童 AI",
                description: "此应用程序是您的智能高尔夫伴侣。它使用 GPS 计算到果岭的精确距离，分析风况，并利用人工智能为每次击球建议理想的球杆。它跟踪多名球员的杆数，并考虑差点计算最终获胜者。",
                developer: "由 Ariel Bulacio 开发，2026 年",
                rights: "版权所有"
            },
            playerType: {
                Beginner: "初学者",
                Professional: "专业的"
            }
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "es", // Default language Spanish
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
