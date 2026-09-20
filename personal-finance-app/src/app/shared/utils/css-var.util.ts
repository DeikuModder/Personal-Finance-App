function fallbackOf(name: string): string {
  switch (name) {
    case '--accent':
      return '#ff6e6e';
    case '--accent-deep':
      return '#d62020';
    case '--positive':
      return '#03dac6';
    case '--danger':
      return '#cf6679';
    default:
      return '';
  }
}

export function cssVar(name: string): string {
  if (typeof document === 'undefined') return fallbackOf(name);
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallbackOf(name);
  } catch {
    return fallbackOf(name);
  }
}