import { WeatherData, getWeatherDescription } from "@/lib/weather";
import {
  Cloud,
  Eye,
  Gauge,
  Droplets,
  Wind,
  Sun,
  AlertCircle,
  Sunrise,
  Sunset,
  Clock,
} from "lucide-react";

interface CurrentWeatherProps {
  data: WeatherData;
  cityName: string;
}

function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

function getAQILabel(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "text-green-600";
  if (aqi <= 100) return "text-yellow-600";
  if (aqi <= 150) return "text-orange-600";
  if (aqi <= 200) return "text-red-600";
  if (aqi <= 300) return "text-purple-600";
  return "text-red-900";
}

function getUVRecommendation(uvIndex: number): {
  level: string;
  recommendation: string;
  color: string;
} {
  if (uvIndex < 3) {
    return {
      level: "Low",
      recommendation: "Minimal sun protection needed",
      color: "text-green-600",
    };
  }
  if (uvIndex < 6) {
    return {
      level: "Moderate",
      recommendation: "Wear sunscreen & hat",
      color: "text-yellow-600",
    };
  }
  if (uvIndex < 8) {
    return {
      level: "High",
      recommendation: "Use SPF 30+ sunscreen",
      color: "text-orange-600",
    };
  }
  if (uvIndex < 11) {
    return {
      level: "Very High",
      recommendation: "Extra protection needed",
      color: "text-red-600",
    };
  }
  return {
    level: "Extreme",
    recommendation: "Avoid sun exposure",
    color: "text-red-900",
  };
}

function getWindDirectionArrow(degrees: number): string {
  const normalizedDegrees = ((degrees % 360) + 360) % 360;

  if (normalizedDegrees < 22.5 || normalizedDegrees >= 337.5) return "↓";
  if (normalizedDegrees < 67.5) return "↙";
  if (normalizedDegrees < 112.5) return "←";
  if (normalizedDegrees < 157.5) return "↖";
  if (normalizedDegrees < 202.5) return "↑";
  if (normalizedDegrees < 247.5) return "↗";
  if (normalizedDegrees < 292.5) return "→";
  return "↘";
}

function formatTime(timeString: string): string {
  if (!timeString) return "--:--";
  const time = new Date(timeString);
  return time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CurrentWeather({ data, cityName }: CurrentWeatherProps) {
  const weather = getWeatherDescription(
    data.current.weatherCode,
    data.current.isDay,
  );
  const windDirection = data.current.windDirection.toFixed(0);

  const getWindDirection = (degrees: number) => {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const tempC = data.current.temperature;
  const tempF = celsiusToFahrenheit(tempC);
  const feelsLikeC = data.current.apparentTemperature;
  const feelsLikeF = celsiusToFahrenheit(feelsLikeC);

  const aqiLabel = getAQILabel(data.current.aqi);
  const aqiColor = getAQIColor(data.current.aqi);

  const uvInfo = getUVRecommendation(data.current.uvIndex);
  const windArrow = getWindDirectionArrow(parseFloat(windDirection));
  const windDir = getWindDirection(parseFloat(windDirection));

  const lastUpdated = new Date();
  const lastUpdatedStr = lastUpdated.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full">
      {/* Main Current Conditions */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {cityName}
            </h1>

            <p className="text-2xl font-semibold text-primary mb-1">
              {tempC.toFixed(0)}°C / {tempF.toFixed(0)}°F
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              {weather.description}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Feels like {feelsLikeC.toFixed(0)}°C / {feelsLikeF.toFixed(0)}°F
              </p>
              <p className="text-sm text-muted-foreground">
                AQI: {data.current.aqi.toFixed(0)} ({aqiLabel})
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated: {lastUpdatedStr}
              </p>
            </div>
          </div>
          <div className="text-7xl">{weather.icon}</div>
        </div>
      </div>

      {/* Sunrise/Sunset */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-400/10 to-orange-500/10 border border-orange-200 dark:border-orange-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sunrise className="h-5 w-5 text-orange-600" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Sunrise
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatTime(data.current.sunrise)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-400/10 to-indigo-500/10 border border-indigo-200 dark:border-indigo-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sunset className="h-5 w-5 text-indigo-600" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Sunset
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatTime(data.current.sunset)}
          </p>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="h-4 w-4 text-secondary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Humidity
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.current.relativeHumidity}%
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="h-4 w-4 text-secondary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Wind Speed
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.current.windSpeed.toFixed(1)} m/s
          </p>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground gap-2">
            <span className="font-semibold">{windDir}</span>
            <div
              className="text-xl font-bold"
              style={{
                transform: `rotate(${data.current.windDirection}deg)`,
                display: "inline-block",
              }}
            >
              ↓
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-secondary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Pressure
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.current.pressureMsl.toFixed(0)} hPa
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-secondary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Visibility
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {(data.current.visibility / 1000).toFixed(1)} km
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="h-4 w-4 text-accent" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              UV Index
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.current.uvIndex.toFixed(1)}
          </p>
          <p className={`text-xs font-semibold mt-1 ${uvInfo.color}`}>
            {uvInfo.level}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {uvInfo.recommendation}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-4 w-4 text-secondary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Precipitation
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.current.precipitation.toFixed(1)} mm
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-secondary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Air Quality
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.current.aqi.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{aqiLabel}</p>
        </div>
      </div>
    </div>
  );
}
