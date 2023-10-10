const getWeatherData = () => [
    {
        location: {
            name: 'Malta',
        },
        forecastUrl: 'https://openweathermap.org/city/2562770',
        iconUrl: 'https://openweathermap.org/img/wn/02d@2x.png',
        weather: 'Few Clouds',
        temp: '29 C',
    },
    {
        location: {
            name: 'Dubai',
        },
        forecastUrl: 'https://openweathermap.org/city/292223',
        iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
        weather: 'Clear Sky',
        temp: '39 C',
    },
    {
        location: {
            name: 'Carlisle',
        },
        forecastUrl: 'https://openweathermap.org/city/2653775',
        iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
        weather: 'Clear Sky',
        temp: '15 C',
    },
];

export const weatherMiddleware = (req, res, next) => {
    if (!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = getWeatherData();
    next();
};
