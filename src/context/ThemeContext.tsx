import { createContext, useContext, useEffect } from 'react';

type Theme = 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.removeItem('tf-theme');
  }, []);

  return <ThemeContext.Provider value={{ theme: 'dark', toggle: () => {} }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
