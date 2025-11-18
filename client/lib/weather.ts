export interface WeatherData {
  current: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    isDay: boolean;
    relativeHumidity: number;
    apparentTemperature: number;
    pressureMsl: number;
    visibility: number;
    uvIndex: number;
    precipitation: number;
    aqi: number;
    sunrise: string;
    sunset: string;
  };
  hourly: {
    time: string[];
    temperature2m: number[];
    weatherCode: number[];
    precipitation: number[];
    windSpeed10m: number[];
  };
  daily: {
    time: string[];
    weatherCode: number[];
    temperature2mMax: number[];
    temperature2mMin: number[];
    precipitation: number[];
    windSpeed10mMax: number[];
    sunrise: string[];
    sunset: string[];
  };
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface LocationData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  featureCode?: string;
  countryCode?: string;
  timezone?: string;
  population?: number;
  country?: string;
  admin1?: string;
  admin2?: string;
}

const WMO_CODES_DAY: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear sky", icon: "☀️" },
  1: { description: "Mainly clear", icon: "🌤️" },
  2: { description: "Partly cloudy", icon: "⛅" },
  3: { description: "Overcast", icon: "☁️" },
  45: { description: "Foggy", icon: "🌫️" },
  48: { description: "Depositing rime fog", icon: "🌫️" },
  51: { description: "Light drizzle", icon: "🌦️" },
  53: { description: "Moderate drizzle", icon: "🌧️" },
  55: { description: "Dense drizzle", icon: "🌧️" },
  61: { description: "Slight rain", icon: "🌧️" },
  63: { description: "Moderate rain", icon: "🌧️" },
  65: { description: "Heavy rain", icon: "⛈️" },
  71: { description: "Slight snow", icon: "🌨️" },
  73: { description: "Moderate snow", icon: "🌨️" },
  75: { description: "Heavy snow", icon: "🌨️" },
  77: { description: "Snow grains", icon: "🌨️" },
  80: { description: "Slight rain showers", icon: "🌧️" },
  81: { description: "Moderate rain showers", icon: "🌧️" },
  82: { description: "Violent rain showers", icon: "⛈️" },
  85: { description: "Slight snow showers", icon: "🌨️" },
  86: { description: "Heavy snow showers", icon: "🌨️" },
  95: { description: "Thunderstorm", icon: "⛈️" },
  96: { description: "Thunderstorm with slight hail", icon: "⛈️" },
  99: { description: "Thunderstorm with heavy hail", icon: "⛈️" },
};

const WMO_CODES_NIGHT: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear sky", icon: "🌙" },
  1: { description: "Mainly clear", icon: "🌙" },
  2: { description: "Partly cloudy", icon: "🌤️" },
  3: { description: "Overcast", icon: "☁️" },
  45: { description: "Foggy", icon: "🌫️" },
  48: { description: "Depositing rime fog", icon: "🌫️" },
  51: { description: "Light drizzle", icon: "🌦️" },
  53: { description: "Moderate drizzle", icon: "🌧️" },
  55: { description: "Dense drizzle", icon: "🌧️" },
  61: { description: "Slight rain", icon: "🌧️" },
  63: { description: "Moderate rain", icon: "🌧️" },
  65: { description: "Heavy rain", icon: "⛈️" },
  71: { description: "Slight snow", icon: "🌨️" },
  73: { description: "Moderate snow", icon: "🌨️" },
  75: { description: "Heavy snow", icon: "🌨️" },
  77: { description: "Snow grains", icon: "🌨️" },
  80: { description: "Slight rain showers", icon: "🌧️" },
  81: { description: "Moderate rain showers", icon: "🌧️" },
  82: { description: "Violent rain showers", icon: "⛈️" },
  85: { description: "Slight snow showers", icon: "🌨️" },
  86: { description: "Heavy snow showers", icon: "🌨️" },
  95: { description: "Thunderstorm", icon: "⛈️" },
  96: { description: "Thunderstorm with slight hail", icon: "⛈️" },
  99: { description: "Thunderstorm with heavy hail", icon: "⛈️" },
};

export function getWeatherDescription(
  code: number,
  isDay: boolean = true,
): {
  description: string;
  icon: string;
} {
  const codes = isDay ? WMO_CODES_DAY : WMO_CODES_NIGHT;
  return codes[code] || { description: "Unknown", icon: "🌍" };
}

export function isDaytime(
  checkTime: Date,
  sunrise: string,
  sunset: string,
): boolean {
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);
  return checkTime >= sunriseDate && checkTime < sunsetDate;
}

export async function searchLocations(query: string): Promise<LocationData[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query,
      )}&count=50&language=en&format=json`,
    );
    const data = await response.json();
    if (!data.results) return [];

    // Sort results by relevance: exact matches first, then by population
    const results = data.results.sort((a: LocationData, b: LocationData) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase() ? 0 : 1;
      const bExact = b.name.toLowerCase() === query.toLowerCase() ? 0 : 1;

      if (aExact !== bExact) return aExact - bExact;

      // Then sort by population (higher population first)
      return (b.population || 0) - (a.population || 0);
    });

    return results.slice(0, 50);
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
}

export async function getWeatherData(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  try {
    const [weatherResponse, aqiResponse] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day,pressure_msl,visibility,uv_index,precipitation&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset&timezone=auto&forecast_days=10`,
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`,
      ),
    ]);

    const weatherData = await weatherResponse.json();
    const aqiData = await aqiResponse.json();

    // Convert is_day (0 or 1) to boolean
    const isDay = weatherData.current.is_day === 1;

    // Get sunrise and sunset from daily data (first day)
    const sunrise = weatherData.daily.sunrise[0] || "";
    const sunset = weatherData.daily.sunset[0] || "";

    return {
      current: {
        temperature: weatherData.current.temperature_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        windDirection: weatherData.current.wind_direction_10m,
        weatherCode: weatherData.current.weather_code,
        isDay: isDay,
        relativeHumidity: weatherData.current.relative_humidity_2m,
        apparentTemperature: weatherData.current.apparent_temperature,
        pressureMsl: weatherData.current.pressure_msl,
        visibility: weatherData.current.visibility,
        uvIndex: weatherData.current.uv_index,
        precipitation: weatherData.current.precipitation,
        aqi: aqiData.current.us_aqi || 0,
        sunrise: sunrise,
        sunset: sunset,
      },
      hourly: {
        time: weatherData.hourly.time,
        temperature2m: weatherData.hourly.temperature_2m,
        weatherCode: weatherData.hourly.weather_code,
        precipitation: weatherData.hourly.precipitation,
        windSpeed10m: weatherData.hourly.wind_speed_10m,
      },
      daily: {
        time: weatherData.daily.time,
        weatherCode: weatherData.daily.weather_code,
        temperature2mMax: weatherData.daily.temperature_2m_max,
        temperature2mMin: weatherData.daily.temperature_2m_min,
        precipitation: weatherData.daily.precipitation_sum,
        windSpeed10mMax: weatherData.daily.wind_speed_10m_max,
        sunrise: weatherData.daily.sunrise,
        sunset: weatherData.daily.sunset,
      },
      timezone: weatherData.timezone,
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}
