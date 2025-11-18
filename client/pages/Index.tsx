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
import { MapPin, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface LocationCache {
  lat: number;
  lng: number;
  timestamp: number;
  cityName: string;
  isRealLocation: boolean;
}

export default function Index() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [cityName, setCityName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const NEW_DELHI_LAT = 28.6139;
  const NEW_DELHI_LNG = 77.209;

  // Fetch city name from coordinates using reverse geocoding
  const fetchCityName = async (lat: number, lng: number): Promise<string> => {
    try {
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const geocodeData = await geocodeResponse.json();
      return (
        geocodeData.address?.city ||
        geocodeData.address?.town ||
        geocodeData.address?.county ||
        "Your Location"
      );
    } catch (err) {
      console.error("Error fetching city name:", err);
      return "Your Location";
    }
  };

  // Load weather and city name for given coordinates
  const loadWeatherForLocation = async (
    lat: number,
    lng: number,
    defaultCityName: string,
    isRealLocation: boolean,
  ) => {
    try {
      let cityNameToUse = defaultCityName;

      // Fetch city name if we have real coordinates
      if (isRealLocation) {
        cityNameToUse = await fetchCityName(lat, lng);
      }

      // Fetch weather data
      const weatherData = await getWeatherData(lat, lng);
      setWeather(weatherData);
      setCityName(cityNameToUse);
      setError(null);
      setLocationDenied(false);

      // Cache the location
      const cache: LocationCache = {
        lat,
        lng,
        timestamp: Date.now(),
        cityName: cityNameToUse,
        isRealLocation,
      };
      localStorage.setItem("weatherLocationCache", JSON.stringify(cache));
    } catch (err) {
      console.error("Error loading weather:", err);
      setError("Failed to load weather data");
    }
  };

  // Try to get user's current location using geolocation API
  const getCurrentLocation = async (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return null;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(null);
      }, 15000); // 15 seconds timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn("Geolocation error:", error);
          resolve(null);
        },
        {
          timeout: 15000,
          enableHighAccuracy: false,
          maximumAge: 0,
        },
      );
    });
  };

  // Initial load: try to get location from cache or request permission
  useEffect(() => {
    let isMounted = true;

    const initializeWeather = async () => {
      // Check if we have cached location
      const cached = localStorage.getItem("weatherLocationCache");
      if (cached) {
        try {
          const cache: LocationCache = JSON.parse(cached);
          const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

          // Use cached location if less than a week old
          if (Date.now() - cache.timestamp < oneWeekMs) {
            if (isMounted) {
              await loadWeatherForLocation(
                cache.lat,
                cache.lng,
                cache.cityName,
                cache.isRealLocation,
              );
              if (isMounted) {
                if (!cache.isRealLocation) {
                  setLocationDenied(true);
                }
                setLoading(false);
              }
            }
            return;
          }
        } catch (err) {
          console.error("Error parsing cached location:", err);
        }
      }

      // No valid cache, try to get real location (don't show permission prompt on initial load)
      const position = await getCurrentLocation();

      if (isMounted) {
        if (position) {
          // User granted permission or had it already
          await loadWeatherForLocation(
            position.lat,
            position.lng,
            "Your Location",
            true,
          );
        } else {
          // Permission denied or timeout - use New Delhi as default
          await loadWeatherForLocation(
            NEW_DELHI_LAT,
            NEW_DELHI_LNG,
            "New Delhi",
            false,
          );
          setLocationDenied(true);
        }
        setLoading(false);
      }
    };

    initializeWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle location selection from search
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

      // Cache this selected location
      const cache: LocationCache = {
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        timestamp: Date.now(),
        cityName: `${selectedLocation.name}${
          selectedLocation.admin1 ? ", " + selectedLocation.admin1 : ""
        }`,
        isRealLocation: false,
      };
      localStorage.setItem("weatherLocationCache", JSON.stringify(cache));
    } catch (err) {
      console.error("Error fetching weather data:", err);
      setError("Failed to load weather for selected location");
    } finally {
      setLoading(false);
    }
  };

  // Handle "Current" button click - always try fresh geolocation
  const handleUseCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported in your browser");
      setLoading(false);
      return;
    }

    try {
      const position = await getCurrentLocation();

      if (position) {
        // Successfully got location
        await loadWeatherForLocation(
          position.lat,
          position.lng,
          "Your Location",
          true,
        );
      } else {
        // Failed to get location - either permission denied or timeout
        // Check if we had previously denied permission
        const cached = localStorage.getItem("weatherLocationCache");
        if (cached) {
          try {
            const cache: LocationCache = JSON.parse(cached);
            if (!cache.isRealLocation) {
              // Previous state was denied, show message
              setError(
                "Location permission denied. Please enable location in your browser settings and try again.",
              );
              setLocationDenied(true);
              setLoading(false);
              return;
            }
          } catch (err) {
            // Ignore parse errors
          }
        }

        // Either never had permission or fresh denial
        setError(
          "Unable to get your location. Please enable location permission in your browser settings.",
        );
        await loadWeatherForLocation(
          NEW_DELHI_LAT,
          NEW_DELHI_LNG,
          "New Delhi",
          false,
        );
        setLocationDenied(true);
      }
    } catch (err) {
      console.error("Error in handleUseCurrentLocation:", err);
      setError("An error occurred while fetching your location");
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

        {/* Location Denied Warning */}
        {locationDenied && !error && (
          <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-700 dark:text-yellow-500 rounded-lg p-4 mb-6">
            <p className="font-medium">
              Location permission is disabled. Showing New Delhi as default.
            </p>
            <p className="text-sm mt-1">
              To see your own location, enable location permission in your
              browser settings and click the "Current" button.
            </p>
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
