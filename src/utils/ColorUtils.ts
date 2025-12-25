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
export const ColorPalette: ColorPaletteType = {
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
