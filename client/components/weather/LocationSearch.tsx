import { useState, useCallback, useEffect } from "react";
import { searchLocations, LocationData } from "@/lib/weather";
import { Input } from "@/components/ui/input";
import { Loader2, Heart } from "lucide-react";
import { useFavorites } from "./FavoriteLocations";

interface LocationSearchProps {
  onSelectLocation: (location: LocationData) => void;
  loading?: boolean;
  compact?: boolean;
}

export function LocationSearch({
  onSelectLocation,
  loading = false,
  compact = false,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLocations(value);
      setSuggestions(results);
      setShowSuggestions(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectLocation = (location: LocationData) => {
    onSelectLocation(location);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  if (compact) {
    return (
      <div className="relative w-full">
        <div className="flex gap-1 bg-white/60 backdrop-blur-sm border border-primary/40 rounded-md px-3 py-1.5">
          <div className="relative flex-1 min-w-0">
            <Input
              placeholder="Search city..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              onKeyPress={(e) =>
                e.key === "Enter" && query.length >= 2 && handleSearch(query)
              }
              className="border-0 bg-transparent focus:outline-none focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground/60"
              disabled={loading}
            />
            {isSearching && (
              <Loader2 className="absolute right-0 top-2 h-3 w-3 animate-spin text-primary" />
            )}
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10">
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((location) => (
                <button
                  key={`${location.latitude}-${location.longitude}`}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full text-left px-3 py-2 hover:bg-accent/10 border-b border-border/50 last:border-b-0 transition-colors text-sm"
                >
                  <div className="font-medium text-foreground text-sm">
                    {location.name}
                  </div>
                  {location.admin1 && (
                    <div className="text-xs text-muted-foreground">
                      {location.admin1}
                      {location.countryCode && `, ${location.countryCode}`}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex gap-2 bg-white/50 backdrop-blur-sm border-2 border-primary/30 rounded-lg px-4 py-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search for a city..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onKeyPress={(e) =>
              e.key === "Enter" && query.length >= 2 && handleSearch(query)
            }
            className="border-0 bg-transparent focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/70 font-medium"
            disabled={loading}
          />
          {isSearching && (
            <Loader2 className="absolute right-0 top-2 h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10">
          <div className="max-h-80 overflow-y-auto">
            {suggestions.map((location) => (
              <button
                key={`${location.latitude}-${location.longitude}`}
                onClick={() => handleSelectLocation(location)}
                className="w-full text-left px-4 py-3 hover:bg-accent/10 border-b border-border/50 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-foreground">
                  {location.name}
                </div>
                {location.admin1 && (
                  <div className="text-sm text-muted-foreground">
                    {location.admin1}
                    {location.countryCode && `, ${location.countryCode}`}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
