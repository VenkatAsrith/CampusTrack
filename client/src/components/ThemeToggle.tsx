import React, { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Palette, Check } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export type ThemePalette = 'default' | 'coral' | 'monochrome';

interface PaletteOption {
  id: ThemePalette;
  name: string;
  color: string;
  secondary: string;
}

const PALETTES: PaletteOption[] = [
  { id: 'default', name: 'Royal Classic', color: '#3B50DF', secondary: '#EEF2FF' },
  { id: 'coral', name: 'Coral Minimal', color: '#F05A24', secondary: '#FDE1D1' },
  { id: 'monochrome', name: 'Monochrome Minimal', color: '#000000', secondary: '#E0E0E0' },
];

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('campustrack_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [palette, setPalette] = useState<ThemePalette>(() => {
    if (typeof window !== 'undefined') {
      const savedPalette = localStorage.getItem('campustrack_palette') as ThemePalette;
      if (savedPalette && (savedPalette === 'coral' || savedPalette === 'default' || savedPalette === 'monochrome')) {
        return savedPalette;
      }
    }
    return 'default';
  });

  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync Dark Mode class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('campustrack_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('campustrack_theme', 'light');
    }
    window.dispatchEvent(new Event('theme-change'));
  }, [isDark]);

  // Sync Palette attribute
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', palette);
    localStorage.setItem('campustrack_palette', palette);
    window.dispatchEvent(new Event('palette-change'));
  }, [palette]);

  // Outside click listener for palette dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPaletteMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleSelectPalette = (selected: ThemePalette) => {
    setPalette(selected);
    setPaletteMenuOpen(false);
  };

  const getAccentColorClass = () => {
    if (palette === 'coral') return 'text-[#F05A24]';
    if (palette === 'monochrome') return 'text-black dark:text-white';
    return 'text-[#3B50DF]';
  };

  return (
    <div className={`flex items-center space-x-1.5 relative ${className}`} ref={menuRef}>
      {/* Palette Selector Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPaletteMenuOpen(!paletteMenuOpen)}
          className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 focus:outline-none ${
            isDark
              ? 'bg-[#1E293B] text-slate-300 hover:bg-[#334155] border border-[#334155] shadow-sm'
              : 'bg-[#F4F6FA] text-[#1E1E1E] hover:bg-[#E2E8F0] border border-[#E2E8F0] shadow-sm'
          }`}
          title="Select Color Theme"
          aria-label="Select Color Theme"
        >
          <Palette size={18} className={getAccentColorClass()} />
        </button>

        {/* Palette Dropdown Menu */}
        {paletteMenuOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E5E9F2] dark:border-[#334155] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#6C757D] dark:text-slate-400 tracking-wider">
              Theme Palette
            </div>
            {PALETTES.map((p) => {
              const active = palette === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPalette(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'bg-[#F4F6FA] dark:bg-[#334155] text-[#1E1E1E] dark:text-white'
                      : 'text-[#6C757D] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-[#2A374A]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-sm"
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.name}</span>
                  </div>
                  {active && <Check size={14} className="text-[#3B50DF] dark:text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dark / Light Mode Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 focus:outline-none ${
          isDark
            ? 'bg-[#1E293B] text-amber-400 hover:bg-[#334155] border border-[#334155] shadow-sm'
            : 'bg-[#F4F6FA] text-[#1E1E1E] hover:bg-[#E2E8F0] border border-[#E2E8F0] shadow-sm'
        }`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle dark/light theme"
      >
        <div className="relative h-5 w-5 flex items-center justify-center">
          {isDark ? (
            <Sun size={18} className="transition-transform duration-300 rotate-0 scale-100 text-amber-400" />
          ) : (
            <Moon size={18} className={`transition-transform duration-300 rotate-0 scale-100 ${getAccentColorClass()}`} />
          )}
        </div>

        {showLabel && (
          <span className="ml-2 text-xs font-semibold">
            {isDark ? 'Light' : 'Dark'}
          </span>
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;
