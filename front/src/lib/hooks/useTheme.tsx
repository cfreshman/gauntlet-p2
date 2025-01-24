import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext<{
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}>({
  primaryColor: '49 100% 50%',
  setPrimaryColor: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState(
    localStorage.getItem('theme-color') || '49 100% 50%'
  );

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    localStorage.setItem('theme-color', primaryColor);
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 