const https = require('https');

// OpenWeatherMap API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'demo-key';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetch weather data for a given city
 * @param {string} city - City name (e.g., "London", "New York")
 * @returns {Promise<object>} Weather data
 */
function getWeatherForCity(city) {
  return new Promise((resolve, reject) => {
    const url = `${WEATHER_API_BASE}/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const weatherData = JSON.parse(data);
          
          if (response.statusCode === 200) {
            // Format the response
            resolve({
              city: weatherData.name,
              temperature: weatherData.main.temp,
              feelsLike: weatherData.main.feels_like,
              description: weatherData.weather[0].description,
              humidity: weatherData.main.humidity,
              windSpeed: weatherData.wind.speed
            });
          } else {
            reject(new Error(weatherData.message || 'Failed to fetch weather data'));
          }
        } catch (error) {
          reject(new Error('Failed to parse weather data'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = {
  getWeatherForCity
};

