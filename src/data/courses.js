export const courses = [
    {
        id: 'medal-country-club-pilar',
        name: 'Medal Country Club',
        location: 'Pilar, Buenos Aires',
        par: 72,
        tees: {
            blue: { name: 'Azul', rating: 70.5, slope: 123 },
            white: { name: 'Blanca', rating: 68.1, slope: 119 },
            red: { name: 'Rojas', rating: 63.9, slope: 104 }
        },
        holes: [
            { number: 1, par: 4, handicap: 7, yards: 417, coordinates: { lat: -34.425, lng: -58.910 }, image: '/golf/assets/holes/par4.png' },
            { number: 2, par: 4, handicap: 11, yards: 381, coordinates: { lat: -34.426, lng: -58.912 }, image: '/golf/assets/holes/par4.png' },
            { number: 3, par: 4, handicap: 13, yards: 355, coordinates: { lat: -34.427, lng: -58.911 }, image: '/golf/assets/holes/par4.png' },
            { number: 4, par: 5, handicap: 3, yards: 520, coordinates: { lat: -34.428, lng: -58.913 }, image: '/golf/assets/holes/par5.png' },
            { number: 5, par: 3, handicap: 15, yards: 195, coordinates: { lat: -34.429, lng: -58.912 }, image: '/golf/assets/holes/par3.png' },
            { number: 6, par: 5, handicap: 1, yards: 469, coordinates: { lat: -34.430, lng: -58.914 }, image: '/golf/assets/holes/par5.png' },
            { number: 7, par: 3, handicap: 17, yards: 176, coordinates: { lat: -34.431, lng: -58.913 }, image: '/golf/assets/holes/par3.png' },
            { number: 8, par: 4, handicap: 5, yards: 365, coordinates: { lat: -34.432, lng: -58.915 }, image: '/golf/assets/holes/par4.png' },
            { number: 9, par: 4, handicap: 9, yards: 390, coordinates: { lat: -34.433, lng: -58.914 }, image: '/golf/assets/holes/par4.png' },
            { number: 10, par: 4, handicap: 8, yards: 417, coordinates: { lat: -34.434, lng: -58.916 }, image: '/golf/assets/holes/par4.png' },
            { number: 11, par: 4, handicap: 12, yards: 381, coordinates: { lat: -34.435, lng: -58.915 }, image: '/golf/assets/holes/par4.png' },
            { number: 12, par: 4, handicap: 16, yards: 355, coordinates: { lat: -34.436, lng: -58.917 }, image: '/golf/assets/holes/par4.png' },
            { number: 13, par: 5, handicap: 4, yards: 520, coordinates: { lat: -34.437, lng: -58.916 }, image: '/golf/assets/holes/par5.png' },
            { number: 14, par: 3, handicap: 14, yards: 195, coordinates: { lat: -34.438, lng: -58.918 }, image: '/golf/assets/holes/par3.png' },
            { number: 15, par: 4, handicap: 2, yards: 430, coordinates: { lat: -34.439, lng: -58.917 }, image: '/golf/assets/holes/par4.png' },
            { number: 16, par: 3, handicap: 18, yards: 176, coordinates: { lat: -34.440, lng: -58.919 }, image: '/golf/assets/holes/par3.png' },
            { number: 17, par: 4, handicap: 6, yards: 365, coordinates: { lat: -34.441, lng: -58.918 }, image: '/golf/assets/holes/par4.png' },
            { number: 18, par: 4, handicap: 10, yards: 390, coordinates: { lat: -34.442, lng: -58.920 }, image: '/golf/assets/holes/par4.png' },
        ]
    }
];

export const players = [
    { id: 1, name: 'Ariel Bulacio', handicap: 25, type: 'Beginner' },
    { id: 2, name: 'Luis María Vitelli', handicap: 12, type: 'Professional' }
];
