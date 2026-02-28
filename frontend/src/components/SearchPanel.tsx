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
    <div className="px-3 py-2 space-y-2">
      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Station name..."
        className="w-full px-2 py-1.5 text-[11px] bg-hud-bg border border-hud-border hud-text focus:border-hud-green outline-none transition-all"
      />

      {/* Tag quick-select */}
      <div className="flex flex-wrap gap-1">
        {POPULAR_TAGS.map(t => (
          <button
            key={t}
            onClick={() => { setTag(t); onSearch({ tag: t, country, name }); }}
            className={`px-1.5 py-0.5 text-[9px] tracking-wide border transition-all ${
              tag === t
                ? 'border-hud-green hud-text bg-hud-green/10'
                : 'border-hud-border hud-text-dim hover:border-hud-green/40'
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
          className="w-full px-2 py-1.5 text-[11px] bg-hud-bg border border-hud-border hud-text focus:border-hud-green outline-none transition-all pr-6"
        />
        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 hud-text-dim pointer-events-none" />
        {showCountryDropdown && filteredCountries.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-hud-panel border border-hud-border max-h-32 overflow-y-auto">
            {filteredCountries.map(c => (
              <button
                key={c.name}
                onClick={() => { setCountry(c.name); setShowCountryDropdown(false); onSearch({ tag, country: c.name, name }); }}
                className="w-full text-left px-2 py-1 text-[10px] hud-text-dim hover:hud-text hover:bg-hud-green/10 transition-colors"
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
          className="flex-1 py-1.5 font-orbitron text-[10px] tracking-widest border border-hud-green hud-text bg-hud-green/10 hover:bg-hud-green/20 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Scanning...' : 'Search'}
        </button>
        {hasAny && (
          <button
            onClick={handleClear}
            className="px-2 py-1.5 border border-hud-border hud-text-dim hover:border-hud-green/50 hover:hud-text transition-all"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
