"use client";

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme ?? (prefersDark ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)] text-[var(--color-text-main)] transition-all shadow-sm flex items-center justify-center border border-[var(--glass-border)]"
      title="Toggle Theme"
    >
      {theme === 'light' && <Moon className="w-5 h-5 pointer-events-none" />}
      {theme === 'dark' && <Sun className="w-5 h-5 text-yellow-400 pointer-events-none" />}
    </button>
  );
}
