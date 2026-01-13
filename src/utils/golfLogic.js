export const recommendClub = (distanceToHole, windSpeed, windDirectionDegrees) => {
    // Simple "AI" logic for club selection
    // Distance in yards
    let adjustedDistance = distanceToHole;

    // Advanced Wind Logic
    // Assumption: Hole direction is North (0 degrees) for calculation simplicity 
    // real app needs hole bearing.
    // If wind is 0° (North) -> Tailwind (pushes ball further) -> Distance feels shorter
    // If wind is 180° (South) -> Headwind (pushes ball back) -> Distance feels longer

    // Calculate wind vector component against shot direction (North 0)
    // cos(0) = 1 (Full tailwind), cos(180) = -1 (Full headwind)
    // We want: 
    // Tailwind: subtract distance
    // Headwind: add distance

    // If windDirectionDegrees is coming FROM that direction:
    // Wind from North (0) blowing South -> means Headwind if we hit North? No. 
    // "Wind from North" means it pushes South. If we hit North, we hit INTO the wind.
    // So Wind 0° = Headwind.

    // Component = Speed * cos(windAngle)
    // If 0°: cos(0)=1. Pushing South. We hit North. So we fight 100% wind. Add distance.
    // If 180°: cos(180)=-1. Blowing North. We hit North. We ride wind. Subtract distance.

    const windRad = (windDirectionDegrees || 0) * (Math.PI / 180);
    const windFactor = Math.cos(windRad); // 1 at North (Head), -1 at South (Tail)

    // Effect magnitude: say 10km/h adds/removes 10 yards max
    // adjustedDistance += Speed * Factor

    adjustedDistance += (windSpeed || 0) * windFactor * 1.0;

    if (adjustedDistance > 230) return "Driver";
    if (adjustedDistance > 210) return "3 Wood";
    if (adjustedDistance > 190) return "5 Wood";
    if (adjustedDistance > 180) return "3 Hybrid";
    if (adjustedDistance > 170) return "4 Iron";
    if (adjustedDistance > 160) return "5 Iron";
    if (adjustedDistance > 150) return "6 Iron";
    if (adjustedDistance > 140) return "7 Iron";
    if (adjustedDistance > 130) return "8 Iron";
    if (adjustedDistance > 120) return "9 Iron";
    if (adjustedDistance > 105) return "Pitching Wedge";
    if (adjustedDistance > 90) return "Gap Wedge";
    if (adjustedDistance > 75) return "Sand Wedge";
    if (adjustedDistance > 40) return "Lob Wedge";
    return "Putter";
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
