import { Color } from '../models/Activity'

/**
 * Type pour une entrée de couleur dans la palette
 */
export interface ColorDefinition {
  hex: string
  rgb: { r: number; g: number; b: number }
  name: string
  tailwind: string
  cssVar: string
}

/**
 * Type pour la palette complète de couleurs
 */
export type ColorPaletteType = {
  [key in Color]: ColorDefinition
}

/**
 * Palette de couleurs associée à l'enum Color
 * Basée sur la maquette vintage avec palette terreuse
 */
// Couleurs originales (avant transformation)
const OriginalColorPalette: ColorPaletteType = {
  [Color.OLIVE_DARK]: {
    hex: '#5B7240',
    rgb: { r: 91, g: 114, b: 64 },
    name: 'Vert olive foncé',
    tailwind: 'slate-700',
    cssVar: '--color-olive-dark',
  },
  [Color.OLIVE_LIGHT]: {
    hex: '#6B8054',
    rgb: { r: 107, g: 128, b: 84 },
    name: 'Vert olive clair',
    tailwind: 'slate-600',
    cssVar: '--color-olive-light',
  },
  [Color.OLIVE_MEDIUM]: {
    hex: '#6B8054',
    rgb: { r: 107, g: 128, b: 84 },
    name: 'Vert olive moyen',
    tailwind: 'slate-600',
    cssVar: '--color-olive-medium',
  },
  [Color.KHAKI_BROWN]: {
    hex: '#847C59',
    rgb: { r: 132, g: 124, b: 89 },
    name: 'Vert kaki',
    tailwind: 'amber-700',
    cssVar: '--color-khaki-brown',
  },
  [Color.MUSTARD]: {
    hex: '#D5A04D',
    rgb: { r: 213, g: 160, b: 77 },
    name: 'Orange moutarde',
    tailwind: 'amber-500',
    cssVar: '--color-mustard',
  },
  [Color.BURNT_ORANGE]: {
    hex: '#C4794B',
    rgb: { r: 196, g: 121, b: 75 },
    name: 'Orange brûlé',
    tailwind: 'orange-600',
    cssVar: '--color-burnt-orange',
  },
  [Color.TEAL_MUTED]: {
    hex: '#6B918B',
    rgb: { r: 107, g: 145, b: 139 },
    name: 'Sarcelle sourd',
    tailwind: 'teal-600',
    cssVar: '--color-teal-muted',
  },
  [Color.WOOD_BG]: {
    hex: '#EADDCD',
    rgb: { r: 234, g: 221, b: 205 },
    name: 'Beige bois',
    tailwind: 'stone-100',
    cssVar: '--color-wood-bg',
  },
} as const

// Fonction pour convertir hex en RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

// Palette avec couleurs rendues 10% plus joyeuses
export const ColorPalette: ColorPaletteType = {
  [Color.OLIVE_DARK]: (() => {
    const happierHex = makeColorHappier(OriginalColorPalette[Color.OLIVE_DARK].hex)
    const rgb = hexToRgb(happierHex)
    return {
      hex: happierHex,
      rgb,
      name: OriginalColorPalette[Color.OLIVE_DARK].name,
      tailwind: OriginalColorPalette[Color.OLIVE_DARK].tailwind,
      cssVar: OriginalColorPalette[Color.OLIVE_DARK].cssVar,
    }
  })(),
  [Color.OLIVE_LIGHT]: (() => {
    const happierHex = makeColorHappier(OriginalColorPalette[Color.OLIVE_LIGHT].hex)
    const rgb = hexToRgb(happierHex)
    return {
      hex: happierHex,
      rgb,
      name: OriginalColorPalette[Color.OLIVE_LIGHT].name,
      tailwind: OriginalColorPalette[Color.OLIVE_LIGHT].tailwind,
      cssVar: OriginalColorPalette[Color.OLIVE_LIGHT].cssVar,
    }
  })(),
  [Color.OLIVE_MEDIUM]: (() => {
    const happierHex = makeColorHappier(OriginalColorPalette[Color.OLIVE_MEDIUM].hex)
    const rgb = hexToRgb(happierHex)
    return {
      hex: happierHex,
      rgb,
      name: OriginalColorPalette[Color.OLIVE_MEDIUM].name,
      tailwind: OriginalColorPalette[Color.OLIVE_MEDIUM].tailwind,
      cssVar: OriginalColorPalette[Color.OLIVE_MEDIUM].cssVar,
    }
  })(),
  [Color.KHAKI_BROWN]: (() => {
    const happierHex = makeColorHappier(OriginalColorPalette[Color.KHAKI_BROWN].hex)
    const rgb = hexToRgb(happierHex)
    return {
      hex: happierHex,
      rgb,
      name: OriginalColorPalette[Color.KHAKI_BROWN].name,
      tailwind: OriginalColorPalette[Color.KHAKI_BROWN].tailwind,
      cssVar: OriginalColorPalette[Color.KHAKI_BROWN].cssVar,
    }
  })(),
  [Color.MUSTARD]: (() => {
    const happierHex = makeColorHappier(OriginalColorPalette[Color.MUSTARD].hex)
    const rgb = hexToRgb(happierHex)
    return {
      hex: happierHex,
      rgb,
      name: OriginalColorPalette[Color.MUSTARD].name,
      tailwind: OriginalColorPalette[Color.MUSTARD].tailwind,
      cssVar: OriginalColorPalette[Color.MUSTARD].cssVar,
    }
  })(),
  [Color.BURNT_ORANGE]: (() => {
    const happierHex = makeColorHappier(OriginalColorPalette[Color.BURNT_ORANGE].hex)
    const rgb = hexToRgb(happierHex)
    return {
      hex: happierHex,
      rgb,
      name: OriginalColorPalette[Color.BURNT_ORANGE].name,
      tailwind: OriginalColorPalette[Color.BURNT_ORANGE].tailwind,
      cssVar: OriginalColorPalette[Color.BURNT_ORANGE].cssVar,
    }
  })(),
  [Color.TEAL_MUTED]: (() => {
    const happierHex = makeColorHappier(OriginalColorPalette[Color.TEAL_MUTED].hex)
    const rgb = hexToRgb(happierHex)
    return {
      hex: happierHex,
      rgb,
      name: OriginalColorPalette[Color.TEAL_MUTED].name,
      tailwind: OriginalColorPalette[Color.TEAL_MUTED].tailwind,
      cssVar: OriginalColorPalette[Color.TEAL_MUTED].cssVar,
    }
  })(),
  [Color.WOOD_BG]: (() => {
    const happierHex = makeColorHappier(OriginalColorPalette[Color.WOOD_BG].hex)
    const rgb = hexToRgb(happierHex)
    return {
      hex: happierHex,
      rgb,
      name: OriginalColorPalette[Color.WOOD_BG].name,
      tailwind: OriginalColorPalette[Color.WOOD_BG].tailwind,
      cssVar: OriginalColorPalette[Color.WOOD_BG].cssVar,
    }
  })(),
} as const

/**
 * Fonction utilitaire pour obtenir la valeur hexadécimale d'une couleur
 * Accepte soit un Color enum soit un hex string
 */
export function getColorHex(color: Color | string): string {
  if (typeof color === 'string' && color.startsWith('#')) {
    return color
  }
  return ColorPalette[color as Color].hex
}

/**
 * Fonction utilitaire pour obtenir les valeurs RGB d'une couleur
 */
export function getColorRgb(color: Color): { r: number; g: number; b: number } {
  return ColorPalette[color].rgb
}

/**
 * Fonction utilitaire pour obtenir le nom d'une couleur
 */
export function getColorName(color: Color): string {
  return ColorPalette[color].name
}

/**
 * Fonction utilitaire pour obtenir la classe Tailwind d'une couleur
 */
export function getColorTailwind(color: Color): string {
  return ColorPalette[color].tailwind
}

/**
 * Fonction utilitaire pour obtenir la variable CSS d'une couleur
 */
export function getColorCssVar(color: Color): string {
  return ColorPalette[color].cssVar
}

/**
 * Fonction utilitaire pour obtenir la valeur CSS d'une couleur (utilisable directement)
 */
export function getColorCssValue(color: Color): string {
  return `var(${ColorPalette[color].cssVar})`
}

/**
 * Détermine la couleur du texte (noir ou blanc) en fonction de la luminosité du fond
 * @param hex - La couleur hexadécimale du fond (format: #RRGGBB)
 * @returns La couleur du texte (#000000 pour fond clair, #FFFFFF pour fond foncé)
 */
export function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Calcul de la luminosité relative
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Convertit une couleur hex en HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s, l }
}

/**
 * Convertit HSL en hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h < 1 / 6) {
    r = c
    g = x
    b = 0
  } else if (h < 2 / 6) {
    r = x
    g = c
    b = 0
  } else if (h < 3 / 6) {
    r = 0
    g = c
    b = x
  } else if (h < 4 / 6) {
    r = 0
    g = x
    b = c
  } else if (h < 5 / 6) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Rend une couleur 20% plus joyeuse en augmentant la saturation et la luminosité
 * @param hex - La couleur hexadécimale (format: #RRGGBB)
 * @returns La couleur rendue plus joyeuse
 */
export function makeColorHappier(hex: string): string {
  const hsl = hexToHsl(hex)
  
  // Augmenter la saturation de 20% (max 100%)
  const newSaturation = Math.min(1, hsl.s * 1.2)
  
  // Augmenter la luminosité de 20% (max 100%, mais on garde un peu de contraste)
  const newLightness = Math.min(0.9, hsl.l * 1.2)
  
  return hslToHex(hsl.h, newSaturation, newLightness)
}
