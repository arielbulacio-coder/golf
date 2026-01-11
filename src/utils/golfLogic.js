export const recommendClub = (distanceToHole, windSpeed, windDirection) => {
    // Simple "AI" logic for club selection
    // Distance in yards

    let adjustedDistance = distanceToHole;

    // Simple wind adjustment (assuming windDirection 'head' or 'tail' relative to shot for simplicity, 
    // in a real app we'd calculate vector)
    if (windDirection === 'headwind') {
        adjustedDistance += windSpeed * 1.5;
    } else if (windDirection === 'tailwind') {
        adjustedDistance -= windSpeed * 1;
    }

    if (adjustedDistance > 230) return "Driver";
    if (adjustedDistance > 210) return "3 Wood";
    if (adjustedDistance > 190) return "5 Wood";
    if (adjustedDistance > 180) return "4 Iron";
    if (adjustedDistance > 170) return "5 Iron";
    if (adjustedDistance > 160) return "6 Iron";
    if (adjustedDistance > 150) return "7 Iron";
    if (adjustedDistance > 140) return "8 Iron";
    if (adjustedDistance > 130) return "9 Iron";
    if (adjustedDistance > 110) return "Pitching Wedge";
    if (adjustedDistance > 90) return "Gap Wedge";
    if (adjustedDistance > 60) return "Sand Wedge";
    return "Lob Wedge / Putter";
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return Math.round(d * 1.09361); // convert to yards
};
