import { Globe, Search, X } from "lucide-react";
import React from "react";

interface AppHeaderProps {
  activeView: "stations" | "favorites" | "globe";
  onViewChange: (view: "stations" | "favorites" | "globe") => void;
  favoritesCount: number;
  searchOpen: boolean;
  onSearchToggle: () => void;
  hasActiveSearch: boolean;
}

export function AppHeader({
  activeView,
  onViewChange,
  favoritesCount,
  searchOpen,
  onSearchToggle,
  hasActiveSearch,
}: AppHeaderProps) {
  return (
    <header className="shrink-0 border-b border-transparent px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Logo + Title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <h1 className="font-heading text-xl tracking-tight text-foreground leading-none">
            Antenna
          </h1>
        </div>

        {/* Search toggle */}
        <button
          type="button"
          onClick={onSearchToggle}
          className={`p-1.5 rounded transition-colors ${
            searchOpen || hasActiveSearch
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
          aria-label="Toggle search"
        >
          {searchOpen ? <X size={15} /> : <Search size={15} />}
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mt-3">
        <button
          type="button"
          onClick={() => onViewChange("stations")}
          className={`flex-1 py-1.5 text-xs font-medium tracking-wide rounded transition-colors ${
            activeView === "stations"
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          Stations
        </button>
        <button
          type="button"
          onClick={() => onViewChange("favorites")}
          className={`flex-1 py-1.5 text-xs font-medium tracking-wide rounded transition-colors relative ${
            activeView === "favorites"
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          Saved
          {favoritesCount > 0 && (
            <span className="ml-1.5 text-[10px] text-muted-foreground">
              {favoritesCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onViewChange("globe")}
          className={`flex-1 py-1.5 text-xs font-medium tracking-wide rounded transition-colors flex items-center justify-center gap-1 ${
            activeView === "globe"
              ? "text-foreground bg-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Globe size={11} />
          Globe
        </button>
      </div>
    </header>
  );
}
