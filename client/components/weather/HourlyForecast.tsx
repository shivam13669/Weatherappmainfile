import { WeatherData, getWeatherDescription, isDaytime } from "@/lib/weather";
import { useEffect, useState } from "react";

interface HourlyForecastProps {
  data: WeatherData;
}

export function HourlyForecast({ data }: HourlyForecastProps) {
  const [currentHourIndex, setCurrentHourIndex] = useState(0);

  useEffect(() => {
    const now = new Date();
    const hourString = now.toISOString().split(":")[0] + ":00";
    const index = data.hourly.time.findIndex((time) =>
      time.startsWith(hourString),
    );
    setCurrentHourIndex(index >= 0 ? index : 0);
  }, [data.hourly.time]);

  const nextHours = data.hourly.time
    .slice(currentHourIndex, currentHourIndex + 24)
    .map((time, idx) => ({
      time: new Date(time),
      temp: data.hourly.temperature2m[currentHourIndex + idx],
      weatherCode: data.hourly.weatherCode[currentHourIndex + idx],
      precipitation: data.hourly.precipitation[currentHourIndex + idx],
      windSpeed: data.hourly.windSpeed10m[currentHourIndex + idx],
    }));

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-foreground mb-4">
        Hourly Forecast
      </h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex gap-4 p-4 min-w-min">
            {nextHours.map((hour, idx) => {
              const weather = getWeatherDescription(hour.weatherCode);
              const timeStr = hour.time.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 flex-shrink-0 min-w-[100px]"
                >
                  <p className="text-xs font-semibold text-muted-foreground">
                    {timeStr}
                  </p>
                  <p className="text-2xl">{weather.icon}</p>
                  <p className="text-lg font-bold text-foreground">
                    {hour.temp.toFixed(0)}°
                  </p>
                  {hour.precipitation > 0 && (
                    <p className="text-xs text-secondary">
                      {hour.precipitation.toFixed(1)}mm
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {hour.windSpeed.toFixed(0)} m/s
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
