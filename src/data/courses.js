export const courses = [
    {
        id: 'medal-country-club-pilar',
        name: 'Medal Country Club',
        location: 'Pilar, Buenos Aires (Ruta 34 km 54.5)',
        par: 72,
        tees: {
            blue: { name: 'Azul', rating: 70.5, slope: 123 },
            white: { name: 'Blanca', rating: 68.1, slope: 119 },
            red: { name: 'Rojas', rating: 63.9, slope: 104 }
        },
        holes: [
            // Ida (Out)
            { number: 1, par: 4, handicap: 7, yards: 417, coordinates: { lat: -34.4442, lng: -58.9665 }, image: '/golf/assets/holes/par4.png' },
            { number: 2, par: 4, handicap: 11, yards: 381, coordinates: { lat: -34.4460, lng: -58.9670 }, image: '/golf/assets/holes/par4.png' },
            { number: 3, par: 4, handicap: 13, yards: 355, coordinates: { lat: -34.4475, lng: -58.9680 }, image: '/golf/assets/holes/par4.png' },
            { number: 4, par: 5, handicap: 3, yards: 520, coordinates: { lat: -34.4490, lng: -58.9650 }, image: '/golf/assets/holes/par5.png' },
            { number: 5, par: 3, handicap: 15, yards: 195, coordinates: { lat: -34.4505, lng: -58.9640 }, image: '/golf/assets/holes/par3.png' },
            { number: 6, par: 5, handicap: 1, yards: 469, coordinates: { lat: -34.4520, lng: -58.9660 }, image: '/golf/assets/holes/par5.png' },
            { number: 7, par: 3, handicap: 17, yards: 176, coordinates: { lat: -34.4530, lng: -58.9675 }, image: '/golf/assets/holes/par3.png' },
            { number: 8, par: 4, handicap: 5, yards: 365, coordinates: { lat: -34.4540, lng: -58.9690 }, image: '/golf/assets/holes/par4.png' },
            { number: 9, par: 4, handicap: 9, yards: 390, coordinates: { lat: -34.4550, lng: -58.9680 }, image: '/golf/assets/holes/par4.png' },

            // Vuelta (In)
            { number: 10, par: 4, handicap: 8, yards: 417, coordinates: { lat: -34.4545, lng: -58.9660 }, image: '/golf/assets/holes/par4.png' },
            { number: 11, par: 4, handicap: 12, yards: 381, coordinates: { lat: -34.4535, lng: -58.9645 }, image: '/golf/assets/holes/par4.png' },
            { number: 12, par: 4, handicap: 16, yards: 355, coordinates: { lat: -34.4525, lng: -58.9630 }, image: '/golf/assets/holes/par4.png' },
            { number: 13, par: 5, handicap: 4, yards: 520, coordinates: { lat: -34.4510, lng: -58.9615 }, image: '/golf/assets/holes/par5.png' },
            { number: 14, par: 3, handicap: 14, yards: 195, coordinates: { lat: -34.4500, lng: -58.9625 }, image: '/golf/assets/holes/par3.png' },
            { number: 15, par: 4, handicap: 2, yards: 430, coordinates: { lat: -34.4490, lng: -58.9640 }, image: '/golf/assets/holes/par4.png' },
            { number: 16, par: 3, handicap: 18, yards: 176, coordinates: { lat: -34.4480, lng: -58.9655 }, image: '/golf/assets/holes/par3.png' },
            { number: 17, par: 4, handicap: 6, yards: 365, coordinates: { lat: -34.4470, lng: -58.9665 }, image: '/golf/assets/holes/par4.png' },
            { number: 18, par: 4, handicap: 10, yards: 390, coordinates: { lat: -34.4450, lng: -58.9670 }, image: '/golf/assets/holes/par4.png' },
        ]
    }
];

export const players = [
    { id: 1, name: 'Ariel Bulacio', handicap: 25, type: 'Beginner' },
    { id: 2, name: 'Luis María Vitelli', handicap: 12, type: 'Professional' }
];
