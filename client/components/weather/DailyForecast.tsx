import { useState } from "react";
import { WeatherData, getWeatherDescription } from "@/lib/weather";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface DailyForecastProps {
  data: WeatherData;
}

export function DailyForecast({ data }: DailyForecastProps) {
  const [viewMode, setViewMode] = useState<"week" | "extended">("week");

  const daysToShow = viewMode === "week" ? 7 : 10;
  const nextDays = data.daily.time.slice(0, daysToShow).map((time, idx) => ({
    date: new Date(time),
    weatherCode: data.daily.weatherCode[idx],
    tempMax: data.daily.temperature2mMax[idx],
    tempMin: data.daily.temperature2mMin[idx],
    precipitation: data.daily.precipitation[idx],
    windSpeed: data.daily.windSpeed10mMax[idx],
  }));

  const today = new Date();
  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">
          {viewMode === "week" ? "7-Day Forecast" : "10-Day Forecast"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "week"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/20"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("extended")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "extended"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/20"
            }`}
          >
            Extended
          </button>
        </div>
      </div>

      {viewMode === "week" ? (
        // Week overview - more compact
        <div className="space-y-2">
          {nextDays.map((day, idx) => {
            const weather = getWeatherDescription(day.weatherCode);
            const dateStr = day.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const dayName = day.date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const today_flag = isToday(day.date);

            return (
              <div
                key={idx}
                className={`bg-card border rounded-lg p-4 flex items-center gap-4 transition-colors ${
                  today_flag
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="min-w-[80px]">
                  <p className="font-semibold text-foreground">{dayName}</p>
                  <p className="text-xs text-muted-foreground">{dateStr}</p>
                  {today_flag && (
                    <p className="text-xs text-primary font-semibold">Today</p>
                  )}
                </div>

                <div className="text-4xl">{weather.icon}</div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {weather.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-foreground font-semibold">
                      {day.tempMax.toFixed(0)}°
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-red-400 rounded-full"
                        style={{
                          width: `${Math.max(
                            10,
                            ((day.tempMax - day.tempMin) / 30) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {day.tempMin.toFixed(0)}°
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground space-y-1">
                  {day.precipitation > 0 && (
                    <p>💧 {day.precipitation.toFixed(1)}mm</p>
                  )}
                  <p>💨 {day.windSpeed.toFixed(0)} m/s</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Extended forecast - grid layout
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {nextDays.map((day, idx) => {
            const weather = getWeatherDescription(day.weatherCode);
            const dateStr = day.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const dayName = day.date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const today_flag = isToday(day.date);

            return (
              <div
                key={idx}
                className={`bg-card border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                  today_flag
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div>
                  <p className="font-semibold text-foreground">{dayName}</p>
                  <p className="text-sm text-muted-foreground">{dateStr}</p>
                  {today_flag && (
                    <p className="text-xs text-primary font-semibold">Today</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-4xl">{weather.icon}</p>
                  <p className="text-xs text-right text-muted-foreground leading-tight max-w-[70px]">
                    {weather.description}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-foreground">
                      {day.tempMax.toFixed(0)}°
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {day.tempMin.toFixed(0)}°
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-red-400 rounded-full"
                      style={{
                        width: `${Math.max(
                          20,
                          ((day.tempMax - day.tempMin) / 30) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {day.precipitation > 0 && (
                    <p className="text-secondary font-medium">
                      💧 {day.precipitation.toFixed(1)}mm
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    💨 {day.windSpeed.toFixed(0)} m/s
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
