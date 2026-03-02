import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { fetchCountries } from '../services/radioBrowserApi';

interface SearchPanelProps {
  onSearch: (params: { tag: string; country: string; name: string }) => void;
  isLoading?: boolean;
  currentParams?: { tag: string; country: string; name: string };
}

const POPULAR_TAGS = ['jazz', 'rock', 'pop', 'classical', 'electronic', 'news', 'talk', 'ambient'];

export function SearchPanel({ onSearch, isLoading, currentParams }: SearchPanelProps) {
  const [tag, setTag] = useState(currentParams?.tag ?? '');
  const [country, setCountry] = useState(currentParams?.country ?? '');
  const [name, setName] = useState(currentParams?.name ?? '');
  const [countries, setCountries] = useState<{ name: string }[]>([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCountries().then(setCountries).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = () => {
    onSearch({ tag, country, name });
  };

  const handleClear = () => {
    setTag('');
    setCountry('');
    setName('');
    onSearch({ tag: '', country: '', name: '' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const filteredCountries = countries
    .filter(c => c.name.toLowerCase().includes(country.toLowerCase()))
    .slice(0, 15);

  const hasAny = tag || country || name;

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Station name..."
        className="w-full px-3 py-2 text-sm rounded border border-neutral-border bg-neutral-panel text-foreground placeholder:text-dim focus:border-muted-foreground outline-none transition-colors"
      />

      {/* Tag quick-select */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_TAGS.map(t => (
          <button
            key={t}
            onClick={() => { setTag(t); onSearch({ tag: t, country, name }); }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
              tag === t
                ? 'border-neutral-text text-foreground bg-neutral-active'
                : 'border-neutral-border text-dim hover:border-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Country */}
      <div className="relative" ref={countryRef}>
        <input
          type="text"
          value={country}
          onChange={e => { setCountry(e.target.value); setShowCountryDropdown(true); }}
          onFocus={() => setShowCountryDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Country..."
          className="w-full px-3 py-2 text-sm rounded border border-neutral-border bg-neutral-panel text-foreground placeholder:text-dim focus:border-muted-foreground outline-none transition-colors pr-7"
        />
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
        {showCountryDropdown && filteredCountries.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-neutral-panel border border-neutral-border rounded max-h-36 overflow-y-auto shadow-lg">
            {filteredCountries.map(c => (
              <button
                key={c.name}
                onClick={() => { setCountry(c.name); setShowCountryDropdown(false); onSearch({ tag, country: c.name, name }); }}
                className="w-full text-left px-3 py-1.5 text-xs text-dim hover:text-foreground hover:bg-neutral-hover transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="flex-1 py-2 text-xs font-medium rounded border border-neutral-border text-foreground bg-neutral-active hover:bg-neutral-hover transition-colors disabled:opacity-40"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        {hasAny && (
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded border border-neutral-border text-dim hover:text-foreground hover:bg-neutral-hover transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
