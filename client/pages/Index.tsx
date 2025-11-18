import { useEffect, useState } from "react";
import { getWeatherData, LocationData } from "@/lib/weather";
import { LocationSearch } from "@/components/weather/LocationSearch";
import { CurrentWeather } from "@/components/weather/CurrentWeather";
import { HourlyForecast } from "@/components/weather/HourlyForecast";
import { DailyForecast } from "@/components/weather/DailyForecast";
import { CurrentWeatherSkeleton } from "@/components/weather/CurrentWeatherSkeleton";
import { HourlyForecastSkeleton } from "@/components/weather/HourlyForecastSkeleton";
import { DailyForecastSkeleton } from "@/components/weather/DailyForecastSkeleton";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function Index() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [cityName, setCityName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try to get user's location on first load
  useEffect(() => {
    let isMounted = true;

    const getInitialLocation = async () => {
      // Try to get user's location first
      let userLat: number | null = null;
      let userLng: number | null = null;

      // Check if we have a cached location from previous successful geolocation
      const cachedLocation = localStorage.getItem("userLocation");
      if (cachedLocation) {
        try {
          const { lat, lng, timestamp } = JSON.parse(cachedLocation);
          const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
          // Use cached location if it's less than a week old
          if (Date.now() - timestamp < oneWeekMs) {
            userLat = lat;
            userLng = lng;
          }
        } catch (err) {
          localStorage.removeItem("userLocation");
        }
      }

      // Try to get fresh location from geolocation API
      // Both "Allow" and "Allow while using this site" will work the same way
      if (navigator.geolocation && userLat === null) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              const timeoutId = setTimeout(
                () => reject(new Error("Geolocation timeout")),
                30000, // 30 seconds timeout to accommodate permission dialogs
              );

              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  clearTimeout(timeoutId);
                  resolve(pos);
                },
                (err) => {
                  clearTimeout(timeoutId);
                  reject(err);
                },
                {
                  timeout: 30000,
                  enableHighAccuracy: false,
                  maximumAge: 0, // Always get fresh location
                },
              );
            },
          );

          userLat = position.coords.latitude;
          userLng = position.coords.longitude;

          // Cache successful location
          localStorage.setItem(
            "userLocation",
            JSON.stringify({
              lat: userLat,
              lng: userLng,
              timestamp: Date.now(),
            }),
          );
        } catch (err) {
          console.error("Error getting user location:", err);
          // For any error (including permission denial), fall back to cached location
          if (cachedLocation) {
            try {
              const { lat, lng } = JSON.parse(cachedLocation);
              userLat = lat;
              userLng = lng;
            } catch (e) {
              // Fall through - will show default Delhi
            }
          }
        }
      }

      // Load weather data based on location we found
      const loadWeatherForLocation = async (
        lat: number,
        lng: number,
        defaultCityName: string,
      ) => {
        try {
          // First, fetch the city name
          let cityName = defaultCityName;
          try {
            const geocodeResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
              { signal: AbortSignal.timeout(5000) },
            );
            const geocodeData = await geocodeResponse.json();
            const fetchedCityName =
              geocodeData.address?.city ||
              geocodeData.address?.town ||
              geocodeData.address?.county;

            if (fetchedCityName) {
              cityName = fetchedCityName;
            }
          } catch (err) {
            console.error("Error fetching city name:", err);
            // Keep the default city name as fallback
          }

          // Then fetch weather
          const weatherData = await getWeatherData(lat, lng);
          if (isMounted) {
            setWeather(weatherData);
            setCityName(cityName);
            setError(null);
          }
        } catch (err) {
          console.error("Error fetching weather:", err);
          if (isMounted) {
            setError("Failed to load weather data");
          }
        }
      };

      // Only proceed if we have a valid location
      if (userLat !== null && userLng !== null) {
        await loadWeatherForLocation(userLat, userLng, "Your Location");
      } else {
        // No location available (permission denied), show default location (Delhi)
        await loadWeatherForLocation(28.6139, 77.209, "Delhi");
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    getInitialLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLocationSelect = async (selectedLocation: LocationData) => {
    try {
      setLoading(true);
      setError(null);
      setLocation(selectedLocation);
      setCityName(
        `${selectedLocation.name}${
          selectedLocation.admin1 ? ", " + selectedLocation.admin1 : ""
        }`,
      );

      const weatherData = await getWeatherData(
        selectedLocation.latitude,
        selectedLocation.longitude,
      );
      setWeather(weatherData);
    } catch (err) {
      console.error("Error fetching weather data:", err);
      setError("Failed to load weather for selected location");
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      setLoading(false);
      return;
    }

    // When user clicks "Current", always try fresh geolocation
    // This handles both first-time permission requests and re-requesting
    // after the user changes browser settings (e.g., enables location)
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          const timeoutId = setTimeout(
            () => reject(new Error("Location request timed out")),
            30000,
          );

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            { timeout: 30000, enableHighAccuracy: false },
          );
        },
      );

      const { latitude, longitude } = position.coords;

      // Fetch city name
      let cityName = "Your Location";
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { signal: AbortSignal.timeout(5000) },
        );
        const geocodeData = await geocodeResponse.json();
        const fetchedCityName =
          geocodeData.address?.city ||
          geocodeData.address?.town ||
          geocodeData.address?.county;

        if (fetchedCityName) {
          cityName = fetchedCityName;
        }
      } catch (err) {
        console.error("Error fetching city name:", err);
      }

      // Fetch weather
      const weatherData = await getWeatherData(latitude, longitude);
      setWeather(weatherData);
      setCityName(cityName);
      setError(null);

      // Cache the successful location
      localStorage.setItem(
        "userLocation",
        JSON.stringify({
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
        }),
      );
    } catch (err) {
      console.error("Error getting location:", err);

      // If user denied permission or any other error, fall back to Delhi
      try {
        const weatherData = await getWeatherData(28.6139, 77.209); // Delhi coordinates
        setWeather(weatherData);
        setCityName("Delhi");
        setError(null);
      } catch (weatherErr) {
        console.error("Error fetching Delhi weather:", weatherErr);
        setError("Failed to load weather data");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F2bc45f757d694ca999a2286e144f0311%2F23a4a0a9e98441eab4fcf2b14a51ab5f?format=webp&width=800"
                alt="Weather App Icon"
                className="h-10 w-10"
              />
              <h1 className="text-2xl font-bold text-foreground">WeatherApp</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block w-64">
                <LocationSearch
                  onSelectLocation={handleLocationSelect}
                  loading={loading}
                  compact
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={loading}
                className="gap-2 whitespace-nowrap"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Current</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar - Mobile */}
        <div className="mb-8 sm:hidden">
          <LocationSearch
            onSelectLocation={handleLocationSelect}
            loading={loading}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Weather Content */}
        <div className="space-y-8">
          {loading ? (
            <>
              <CurrentWeatherSkeleton />
              <HourlyForecastSkeleton />
              <DailyForecastSkeleton />
            </>
          ) : (
            <>
              {weather && (
                <>
                  <CurrentWeather data={weather} cityName={cityName} />
                  <HourlyForecast data={weather} />
                  <DailyForecast data={weather} />
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Weather data powered by{" "}
            <a
              href="https://open-meteo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Open-Meteo
            </a>
            {" • "}
            Location data powered by{" "}
            <a
              href="https://www.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              OpenStreetMap
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
