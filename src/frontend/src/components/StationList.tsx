import {
  AlertTriangle,
  Database,
  Loader,
  Play,
  Radio,
  RefreshCw,
  Star,
  WifiOff,
} from "lucide-react";
import type { Station } from "../backend";
import type { RadioStation, StationSource } from "../services/radioBrowserApi";

interface StationListProps {
  stations: RadioStation[] | Station[];
  currentStation: RadioStation | null;
  playbackState: string;
  favorites: Station[];
  onPlay: (station: RadioStation) => void;
  onAddFavorite: (station: RadioStation) => void;
  onRemoveFavorite: (stationName: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  isFavoriteView?: boolean;
  stationSource?: StationSource;
}

function isRadioStation(s: RadioStation | Station): s is RadioStation {
  return "stationuuid" in s;
}

function toRadioStation(s: Station): RadioStation {
  return {
    stationuuid: s.name,
    name: s.name,
    url: s.url,
    url_resolved: s.url,
    homepage: s.homepage,
    favicon: s.favicon,
    tags: s.tags,
    country: s.country,
    countrycode: "",
    language: s.language,
    codec: s.codec,
    bitrate: Number(s.bitrate),
    votes: 0,
    clickcount: 0,
  };
}

function SourceBanner({ source }: { source: StationSource }) {
  if (source === "live") return null;
  const isCached = source === "cache";
  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] bg-muted/40 text-muted-foreground">
      {isCached ? (
        <Database size={9} className="shrink-0 opacity-60" />
      ) : (
        <AlertTriangle size={9} className="shrink-0 opacity-60" />
      )}
      <span className="opacity-70">
        {isCached
          ? "Showing cached stations"
          : "Using fallback stations — API unavailable"}
      </span>
    </div>
  );
}

function StationFavicon({ favicon }: { favicon?: string }) {
  return (
    <div className="w-4 h-4 shrink-0 relative flex items-center justify-center">
      <Radio
        size={11}
        className="text-dim opacity-25 absolute inset-0 m-auto"
      />
      {favicon && (
        <img
          src={favicon}
          alt=""
          className="w-4 h-4 object-contain relative z-10 opacity-50"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}

export function StationList({
  stations,
  currentStation,
  playbackState,
  favorites,
  onPlay,
  onAddFavorite,
  onRemoveFavorite,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyMessage = "No stations found",
  isFavoriteView = false,
  stationSource = "live",
}: StationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader size={18} className="text-dim animate-spin" />
        <span className="text-xs text-dim">Loading stations...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
        <WifiOff size={20} className="text-dim opacity-50" />
        <span className="text-sm text-foreground/70">
          Couldn't load stations
        </span>
        <span className="text-xs text-dim">
          {errorMessage ??
            "The radio directory may be temporarily unavailable."}
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 flex items-center gap-1.5 text-xs px-4 py-1.5 rounded border border-border hover:bg-neutral-hover transition-colors"
          >
            <RefreshCw size={11} />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Radio size={18} className="text-dim opacity-40" />
        <span className="text-xs text-dim">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SourceBanner source={stationSource} />
      {stations.map((s, idx) => {
        const station = isRadioStation(s) ? s : toRadioStation(s);
        const isActive =
          currentStation?.stationuuid === station.stationuuid ||
          currentStation?.name === station.name;
        const isCurrentlyPlaying = isActive && playbackState === "playing";
        const isCurrentlyLoading = isActive && playbackState === "loading";
        const isFav = favorites.some((f) => f.name === station.name);

        return (
          <button
            type="button"
            key={station.stationuuid || idx}
            className={`group flex items-center gap-3 px-4 py-2.5 w-full text-left cursor-pointer transition-colors ${
              isActive ? "station-row-active" : "hover:bg-neutral-hover"
            }`}
            onClick={() => onPlay(station)}
          >
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              {isCurrentlyLoading ? (
                <Loader size={10} className="text-dim animate-spin" />
              ) : isCurrentlyPlaying ? (
                <div className="flex items-end gap-px h-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-foreground"
                      style={{
                        height: "100%",
                        animation: `signal-bar ${0.5 + i * 0.1}s ease-in-out infinite`,
                        animationDelay: `${i * 0.1}s`,
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Play
                  size={10}
                  className="text-dim opacity-0 group-hover:opacity-50 transition-opacity"
                />
              )}
            </div>

            <StationFavicon favicon={station.favicon} />

            <div className="flex-1 min-w-0">
              <div
                className={`text-xs truncate font-medium ${isActive ? "text-foreground" : "text-foreground/80"}`}
              >
                {station.name}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-dim mt-0.5">
                {station.country && <span>{station.country}</span>}
                {station.codec && (
                  <span className="opacity-60">{station.codec}</span>
                )}
                {station.bitrate > 0 && (
                  <span className="opacity-60">{station.bitrate}k</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isFav || isFavoriteView) {
                  onRemoveFavorite(station.name);
                } else {
                  onAddFavorite(station);
                }
              }}
              className={`p-1 transition-all shrink-0 rounded ${
                isFav
                  ? "text-foreground opacity-80"
                  : "text-dim opacity-0 group-hover:opacity-40 hover:opacity-80"
              }`}
              aria-label={isFav ? "Remove from saved" : "Save station"}
            >
              <Star size={11} fill={isFav ? "currentColor" : "none"} />
            </button>
          </button>
        );
      })}
    </div>
  );
}
