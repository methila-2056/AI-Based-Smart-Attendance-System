export type Theme = 'light' | 'dark'

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem('sac_theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem('sac_theme', theme)
  applyTheme(theme)
}

export function initTheme(): void {
  applyTheme(getStoredTheme())
}
