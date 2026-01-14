export const Analytics = {
    NAMESPACE: 'golf-caddy-app-v3',

    // Public keys for our counters
    KEYS: {
        VISITS: 'total_visits',
        // Events
        EVENT_SIMULATOR: 'event_simulator',
        EVENT_SCORECARD: 'event_scorecard',
        EVENT_HISTORY: 'event_history',
        EVENT_TRAINING: 'event_training',

        // Location Keys (Granular for Argentina)
        LOC_AR_BA: 'loc_ar_ba',      // Buenos Aires Province
        LOC_AR_CABA: 'loc_ar_caba',  // CABA
        LOC_AR_CBA: 'loc_ar_cba',    // Córdoba
        LOC_AR_PILAR: 'loc_ar_pilar', // Pilar (Golf Hub)

        LOC_AR: 'loc_ar', // Argentina General
        LOC_MX: 'loc_mx', // Mexico
        LOC_US: 'loc_us', // USA
        LOC_ES: 'loc_es', // Spain
        LOC_OTHER: 'loc_other'
    },

    // Initialize/Increment Visit
    async trackVisit() {
        if (sessionStorage.getItem('visited')) return;
        sessionStorage.setItem('visited', 'true');

        try {
            await this.hit(this.KEYS.VISITS);

            const loc = await this.getLocation();
            if (loc && loc.success) {
                const countryCode = (loc.country_code || '').toLowerCase();
                const region = (loc.region || '').toLowerCase();
                const city = (loc.city || '').toLowerCase();

                let key = this.KEYS.LOC_OTHER;

                if (countryCode === 'ar') {
                    key = this.KEYS.LOC_AR;
                    // Granular AR tracking
                    if (region.includes('buenos aires')) await this.hit(this.KEYS.LOC_AR_BA);
                    if (region.includes('ciudad aut') || region.includes('capital')) await this.hit(this.KEYS.LOC_AR_CABA);
                    if (region.includes('cordoba') || region.includes('córdoba')) await this.hit(this.KEYS.LOC_AR_CBA);

                    if (city.includes('pilar')) await this.hit(this.KEYS.LOC_AR_PILAR);
                }
                else if (countryCode === 'mx') key = this.KEYS.LOC_MX;
                else if (countryCode === 'us') key = this.KEYS.LOC_US;
                else if (countryCode === 'es') key = this.KEYS.LOC_ES;

                await this.hit(key);
            }
        } catch (e) {
            console.warn("Analytics error", e);
        }
    },

    async trackEvent(eventName) {
        let key = null;
        if (eventName === 'simulator') key = this.KEYS.EVENT_SIMULATOR;
        if (eventName === 'scorecard') key = this.KEYS.EVENT_SCORECARD;
        if (eventName === 'history') key = this.KEYS.EVENT_HISTORY;
        if (eventName === 'training') key = this.KEYS.EVENT_TRAINING;

        if (key) {
            try { await this.hit(key); } catch (e) { console.warn("Event track error", e); }
        }
    },

    async hit(key) {
        try {
            await fetch(`https://api.countapi.xyz/hit/${this.NAMESPACE}/${key}`);
        } catch (e) { console.warn("CountAPI hit failed", e); }
    },

    async getStats() {
        try {
            const [
                visits,
                ar, mx, us, es, other,
                ar_ba, ar_caba, ar_cba, ar_pilar,
                sim, score, hist, train
            ] = await Promise.all([
                this.get(this.KEYS.VISITS),
                this.get(this.KEYS.LOC_AR), this.get(this.KEYS.LOC_MX), this.get(this.KEYS.LOC_US), this.get(this.KEYS.LOC_ES), this.get(this.KEYS.LOC_OTHER),
                this.get(this.KEYS.LOC_AR_BA), this.get(this.KEYS.LOC_AR_CABA), this.get(this.KEYS.LOC_AR_CBA), this.get(this.KEYS.LOC_AR_PILAR),
                this.get(this.KEYS.EVENT_SIMULATOR), this.get(this.KEYS.EVENT_SCORECARD), this.get(this.KEYS.EVENT_HISTORY), this.get(this.KEYS.EVENT_TRAINING)
            ]);

            return {
                visits,
                locations: {
                    'Argentina 🇦🇷': ar,
                    '↳ BsAs 🌾': ar_ba,
                    '↳ CABA 🏙️': ar_caba,
                    '↳ Pilar ⛳': ar_pilar,
                    '↳ Córdoba ⛰️': ar_cba,
                    'México 🇲🇽': mx,
                    'USA 🇺🇸': us,
                    'España 🇪🇸': es,
                    'Otros 🌍': other
                },
                features: {
                    'Simulador': sim,
                    'Tarjeta': score,
                    'Historial': hist,
                    'Entrenamiento': train
                }
            };

        } catch (e) {
            console.error("Failed to load stats", e);
            return null;
        }
    },

    async get(key) {
        try {
            const res = await fetch(`https://api.countapi.xyz/get/${this.NAMESPACE}/${key}`);
            const data = await res.json();
            return data.value || 0;
        } catch (e) { return 0; }
    },

    async getLocation() {
        try {
            // Using ipwho.is (Free, HTTPS supported, No Key)
            const res = await fetch('https://ipwho.is/');
            return await res.json();
        } catch (e) { return null; }
    }
};
