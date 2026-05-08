import { useTheme } from '../context/ThemeContext';

/**
 * themed() — passe les styles inline tels quels.
 *
 * Les var(--xxx) en inline styles CSS respectent la cascade :
 * si l'élément parent a .surface-dark qui overrides --text-muted,
 * le navigateur utilisera automatiquement la valeur overridée.
 * On ne résout donc PAS les var() ici — on les laisse au navigateur.
 *
 * Pour les contextes JS pur (Chart.js, canvas…) utiliser resolveVar().
 */
export function resolveVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

export function useThemedStyles() {
  const { themeKey, modeKey } = useTheme();
  // themed() = passthrough — var() CSS gère le contraste via la cascade
  const themed = (styles) => styles;
  return { themed, themeKey, modeKey };
}
