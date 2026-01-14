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

        // Locations (Simple counters for top anticipated users, dynamic creation is harder without backend)
        LOC_AR: 'loc_ar', // Argentina
        LOC_MX: 'loc_mx', // Mexico
        LOC_US: 'loc_us', // USA
        LOC_ES: 'loc_es', // Spain
        LOC_OTHER: 'loc_other'
    },

    // Initialize/Increment Visit
    async trackVisit() {
        // Prevent double counting in same session? (Optional, here we just count Page Loads/App Opens)
        if (sessionStorage.getItem('visited')) return;
        sessionStorage.setItem('visited', 'true');

        try {
            // 1. Increment Global Visits
            await this.hit(this.KEYS.VISITS);

            // 2. Resolve Location and increment country counter
            const loc = await this.getLocation();
            if (loc) {
                const countryCode = loc.countryCode.toLowerCase();
                let key = this.KEYS.LOC_OTHER;

                if (countryCode === 'ar') key = this.KEYS.LOC_AR;
                if (countryCode === 'mx') key = this.KEYS.LOC_MX;
                if (countryCode === 'us') key = this.KEYS.LOC_US;
                if (countryCode === 'es') key = this.KEYS.LOC_ES;

                await this.hit(key);
            }
        } catch (e) {
            console.warn("Analytics error", e);
        }
    },

    async trackEvent(eventName) {
        // Map friendly names to keys
        let key = null;
        if (eventName === 'simulator') key = this.KEYS.EVENT_SIMULATOR;
        if (eventName === 'scorecard') key = this.KEYS.EVENT_SCORECARD;
        if (eventName === 'history') key = this.KEYS.EVENT_HISTORY;
        if (eventName === 'training') key = this.KEYS.EVENT_TRAINING;

        if (key) {
            try {
                await this.hit(key);
            } catch (e) { console.warn("Event track error", e); }
        }
    },

    // Helper to hit CountAPI
    async hit(key) {
        try {
            // Using countapi.xyz
            await fetch(`https://api.countapi.xyz/hit/${this.NAMESPACE}/${key}`);
        } catch (e) {
            console.warn("CountAPI hit failed", e);
        }
    },

    // Get all stats for Admin View
    async getStats() {
        const stats = {
            visits: 0,
            locations: {},
            features: {}
        };

        try {
            // Fetch keys in parallel
            const pVisits = this.get(this.KEYS.VISITS);

            const pLocAR = this.get(this.KEYS.LOC_AR);
            const pLocMX = this.get(this.KEYS.LOC_MX);
            const pLocUS = this.get(this.KEYS.LOC_US);
            const pLocES = this.get(this.KEYS.LOC_ES);
            const pLocOther = this.get(this.KEYS.LOC_OTHER);

            const pSim = this.get(this.KEYS.EVENT_SIMULATOR);
            const pScore = this.get(this.KEYS.EVENT_SCORECARD);
            const pHist = this.get(this.KEYS.EVENT_HISTORY);
            const pTrain = this.get(this.KEYS.EVENT_TRAINING);

            const results = await Promise.all([
                pVisits,
                pLocAR, pLocMX, pLocUS, pLocES, pLocOther,
                pSim, pScore, pHist, pTrain
            ]);

            stats.visits = results[0];
            stats.locations = {
                'Argentina 🇦🇷': results[1],
                'México 🇲🇽': results[2],
                'USA 🇺🇸': results[3],
                'España 🇪🇸': results[4],
                'Otros 🌍': results[5]
            };
            stats.features = {
                'Simulador': results[6],
                'Tarjeta': results[7],
                'Historial': results[8],
                'Entrenamiento': results[9]
            };

            return stats;

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
        } catch (e) {
            return 0;
        }
    },

    // Get User Location from public IP API
    async getLocation() {
        try {
            const res = await fetch('http://ip-api.com/json/');
            const data = await res.json();
            if (data.status === 'success') {
                return data;
            }
            return null;
        } catch (e) {
            return null;
        }
    }
};
