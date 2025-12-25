/**
 * Mapping des classes Tailwind border-radius avec leurs valeurs en pixels
 */
export const BORDER_RADIUS_OPTIONS = {
  'rounded-none': 0,
  'rounded-sm': 2,
  'rounded': 4,
  'rounded-md': 6,
  'rounded-lg': 8,
  'rounded-xl': 12,
  'rounded-2xl': 16,
  'rounded-3xl': 24,
  'rounded-full': 9999,
} as const

export type BorderRadiusClass = keyof typeof BORDER_RADIUS_OPTIONS

/**
 * Obtient la valeur en pixels d'une classe border-radius
 */
export function getBorderRadiusPixels(className: BorderRadiusClass): number {
  return BORDER_RADIUS_OPTIONS[className]
}

/**
 * Obtient la classe Tailwind correspondante à partir d'une valeur en pixels
 */
export function getBorderRadiusClass(pixels: number): BorderRadiusClass {
  const entries = Object.entries(BORDER_RADIUS_OPTIONS) as [BorderRadiusClass, number][]
  // Trouver la classe la plus proche
  let closest: BorderRadiusClass = 'rounded-md'
  let minDiff = Math.abs(BORDER_RADIUS_OPTIONS[closest] - pixels)
  
  for (const [className, value] of entries) {
    const diff = Math.abs(value - pixels)
    if (diff < minDiff) {
      minDiff = diff
      closest = className
    }
  }
  
  return closest
}

/**
 * Liste toutes les options disponibles pour le dropdown
 */
export function getBorderRadiusOptions(): Array<{ value: BorderRadiusClass; label: string; pixels: number }> {
  return Object.entries(BORDER_RADIUS_OPTIONS).map(([className, pixels]) => {
    let label = className.replace('rounded-', '')
    if (label === 'none') label = 'Aucun'
    else if (label === '') label = 'Par défaut'
    else if (label === 'full') label = 'Complet'
    return {
      value: className as BorderRadiusClass,
      label: `${label.charAt(0).toUpperCase() + label.slice(1)} (${pixels}px)`,
      pixels,
    }
  })
}

/**
 * Obtient la classe Tailwind border-radius depuis les settings
 * Cette fonction peut être utilisée dans les composants pour obtenir la classe dynamique
 */
export function getBorderRadiusFromSettings(settings: { design?: { borderRadius?: string } }): string {
  return settings.design?.borderRadius || 'rounded-xl'
}

