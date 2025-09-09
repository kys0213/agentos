import React, { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
}

interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

type ThemeAction = 
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'UPDATE_EFFECTIVE_THEME'; payload: 'light' | 'dark' };

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'UPDATE_EFFECTIVE_THEME':
      return { ...state, effectiveTheme: action.payload };
    default:
      return state;
  }
}

function getInitialTheme(): Theme {
  // Initialize from localStorage
  const savedTheme = localStorage.getItem('agentOS-theme') as Theme;
  return savedTheme || 'system';
}

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [state, dispatch] = useReducer(themeReducer, {
    theme: getInitialTheme(),
    effectiveTheme: getEffectiveTheme(getInitialTheme()),
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    const effectiveTheme = getEffectiveTheme(state.theme);
    
    // Apply theme class
    root.classList.add(effectiveTheme);
    
    // Update effective theme if different
    if (effectiveTheme !== state.effectiveTheme) {
      dispatch({ type: 'UPDATE_EFFECTIVE_THEME', payload: effectiveTheme });
    }
    
    // Save to localStorage
    localStorage.setItem('agentOS-theme', state.theme);
  }, [state.theme, state.effectiveTheme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (state.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const newEffectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      dispatch({ type: 'UPDATE_EFFECTIVE_THEME', payload: newEffectiveTheme });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.theme]);

  // Listen for localStorage changes (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'agentOS-theme' && e.newValue) {
        dispatch({ type: 'SET_THEME', payload: e.newValue as Theme });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: newTheme });
  }, []);

  const value: ThemeContextValue = {
    theme: state.theme,
    effectiveTheme: state.effectiveTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}