'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: Resolved;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', setTheme: () => {}, resolved: 'dark' });

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): Resolved {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolved, setResolved] = useState<Resolved>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('phz-theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const r = theme === 'system' ? getSystemTheme() : theme;
    setResolved(r);
    document.documentElement.classList.toggle('dark', r === 'dark');
    document.documentElement.classList.toggle('light', r === 'light');
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r = getSystemTheme();
      setResolved(r);
      document.documentElement.classList.toggle('dark', r === 'dark');
      document.documentElement.classList.toggle('light', r === 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('phz-theme', t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
