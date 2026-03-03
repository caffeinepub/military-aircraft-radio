import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface SearchPanelProps {
  onSearch: (params: { tag: string; country: string; name: string }) => void;
  isLoading?: boolean;
  currentParams?: { tag: string; country: string; name: string };
}

const POPULAR_TAGS = [
  "jazz",
  "rock",
  "pop",
  "classical",
  "electronic",
  "news",
  "talk",
  "ambient",
];

export function SearchPanel({
  onSearch,
  isLoading,
  currentParams: _currentParams,
}: SearchPanelProps) {
  // Always start fresh — parent key prop ensures remount on each open
  const [tag, setTag] = useState("");
  const [name, setName] = useState("");

  const handleSearch = () => {
    onSearch({ tag, country: "", name });
  };

  const handleClear = () => {
    setTag("");
    setName("");
    onSearch({ tag: "", country: "", name: "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleTagClick = (t: string) => {
    const next = tag === t ? "" : t;
    setTag(next);
    onSearch({ tag: next, country: "", name });
  };

  const hasAny = tag || name;

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Station name..."
        data-ocid="search.search_input"
        className="w-full px-3 py-2 text-sm rounded border border-neutral-border bg-neutral-panel text-foreground placeholder:text-dim focus:border-muted-foreground outline-none transition-colors"
      />

      {/* Tag quick-select (toggleable) */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTagClick(t)}
            data-ocid={`search.tag.toggle.${t}`}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
              tag === t
                ? "border-neutral-text text-foreground bg-neutral-active"
                : "border-neutral-border text-dim hover:border-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          data-ocid="search.submit_button"
          className="flex-1 py-2 text-xs font-medium rounded border border-neutral-border text-foreground bg-neutral-active hover:bg-neutral-hover transition-colors disabled:opacity-40"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
        {hasAny && (
          <button
            type="button"
            onClick={handleClear}
            data-ocid="search.cancel_button"
            className="px-3 py-2 rounded border border-neutral-border text-dim hover:text-foreground hover:bg-neutral-hover transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
