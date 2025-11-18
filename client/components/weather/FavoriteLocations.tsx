import { useState, useEffect } from "react";
import { LocationData } from "@/lib/weather";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FavoriteLocation extends LocationData {
  addedAt: number;
}

interface FavoriteLocationsProps {
  onSelectLocation: (location: LocationData) => void;
  currentLocationName?: string;
}

export function FavoriteLocations({
  onSelectLocation,
  currentLocationName,
}: FavoriteLocationsProps) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favoriteLocations");
    if (saved) {
      try {
        const parsed: FavoriteLocation[] = JSON.parse(saved);
        setFavorites(parsed);
      } catch (err) {
        console.error("Error parsing favorites:", err);
      }
    }
  }, []);

  const addFavorite = (location: LocationData) => {
    const newFavorite: FavoriteLocation = {
      ...location,
      addedAt: Date.now(),
    };

    const updated = [
      newFavorite,
      ...favorites.filter(
        (f) =>
          !(
            f.latitude === location.latitude &&
            f.longitude === location.longitude
          ),
      ),
    ];

    setFavorites(updated);
    localStorage.setItem("favoriteLocations", JSON.stringify(updated));
  };

  const removeFavorite = (location: LocationData) => {
    const updated = favorites.filter(
      (f) =>
        !(
          f.latitude === location.latitude && f.longitude === location.longitude
        ),
    );
    setFavorites(updated);
    localStorage.setItem("favoriteLocations", JSON.stringify(updated));
  };

  const isFavorite = (location: LocationData | string): boolean => {
    if (typeof location === "string") {
      return favorites.some(
        (f) => `${f.name}${f.admin1 ? ", " + f.admin1 : ""}` === location,
      );
    }
    return favorites.some(
      (f) =>
        f.latitude === location.latitude && f.longitude === location.longitude,
    );
  };

  const toggleFavorite = (location: LocationData) => {
    if (isFavorite(location)) {
      removeFavorite(location);
    } else {
      addFavorite(location);
    }
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowFavorites(!showFavorites)}
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        <Heart className="h-4 w-4 fill-current" />
        Favorites ({favorites.length})
      </button>

      {showFavorites && favorites.length > 0 && (
        <div className="mt-3 bg-card border border-border rounded-lg p-3 space-y-2">
          {favorites.map((location) => (
            <div
              key={`${location.latitude}-${location.longitude}`}
              className="flex items-center justify-between p-2 hover:bg-accent/10 rounded transition-colors text-sm group"
            >
              <button
                onClick={() => onSelectLocation(location)}
                className="flex-1 text-left"
              >
                <div className="font-medium text-foreground">
                  {location.name}
                </div>
                {location.admin1 && (
                  <div className="text-xs text-muted-foreground">
                    {location.admin1}
                    {location.countryCode && `, ${location.countryCode}`}
                  </div>
                )}
              </button>
              <button
                onClick={() => removeFavorite(location)}
                className="opacity-0 group-hover:opacity-100 p-1 transition-opacity"
                title="Remove from favorites"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("favoriteLocations");
    if (saved) {
      try {
        const parsed: FavoriteLocation[] = JSON.parse(saved);
        setFavorites(parsed);
      } catch (err) {
        console.error("Error parsing favorites:", err);
      }
    }
  }, []);

  const toggleFavorite = (location: LocationData) => {
    const isFav = favorites.some(
      (f) =>
        f.latitude === location.latitude && f.longitude === location.longitude,
    );

    let updated: FavoriteLocation[];
    if (isFav) {
      updated = favorites.filter(
        (f) =>
          !(
            f.latitude === location.latitude &&
            f.longitude === location.longitude
          ),
      );
    } else {
      updated = [{ ...location, addedAt: Date.now() }, ...favorites];
    }

    setFavorites(updated);
    localStorage.setItem("favoriteLocations", JSON.stringify(updated));
  };

  const isFavorite = (location: LocationData): boolean => {
    return favorites.some(
      (f) =>
        f.latitude === location.latitude && f.longitude === location.longitude,
    );
  };

  return { favorites, toggleFavorite, isFavorite };
}
