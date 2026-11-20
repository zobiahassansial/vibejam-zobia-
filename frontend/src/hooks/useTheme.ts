import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const applied = document.documentElement.getAttribute('data-theme');
    if (applied === 'light' || applied === 'dark') return applied;
    try {
      const stored = localStorage.getItem('askse_theme') as 'light' | 'dark' | null;
      if (stored === 'light' || stored === 'dark') return stored;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('askse_theme', theme);

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#070A14' : '#F6F7FB');
      }
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return { theme, toggleTheme };
}
