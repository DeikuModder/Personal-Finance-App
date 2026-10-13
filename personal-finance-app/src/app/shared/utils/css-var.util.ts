/**
 * Reads a CSS custom property from the document root.
 *
 * Theme variables are defined by `styles.scss` and are always present in the
 * browser build, so no per-variable defaults are baked in here (that would
 * duplicate the theme registry). Callers that need a non-DOM fallback can pass
 * one explicitly.
 */
export function cssVar(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback;
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}
