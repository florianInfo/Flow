import { useState } from 'react'
import { Color } from '../models/Activity'
import { getColorHex } from '../utils/ColorUtils'

interface ColorPickerProps {
  selectedColor: Color | string // Peut être un Color enum ou un hex string
  onColorChange: (color: Color | string) => void
  backgroundColor?: string // Pour le ring offset
  textColor?: 'black' | 'white' // Couleur du texte sélectionnée
  onTextColorChange?: (textColor: 'black' | 'white') => void // Callback pour changer la couleur du texte
}

export default function ColorPicker({
  selectedColor,
  onColorChange,
  backgroundColor,
  textColor = 'black',
  onTextColorChange,
}: ColorPickerProps) {
  const borderColor = textColor === 'white' ? 'rgba(255,255,255,0.3)' : '#000000'
  const [customColor, setCustomColor] = useState<string>(
    typeof selectedColor === 'string' && selectedColor.startsWith('#') 
      ? selectedColor 
      : '#6B918B'
  )
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  // Obtenir la couleur hex actuelle
  const getCurrentHex = (): string => {
    if (typeof selectedColor === 'string' && selectedColor.startsWith('#')) {
      return selectedColor
    }
    return getColorHex(selectedColor as Color)
  }

  const currentHex = getCurrentHex()

  const handlePresetColorClick = (color: Color) => {
    onColorChange(color)
    setShowCustomPicker(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setCustomColor(hex)
    onColorChange(hex)
  }

  const handleCustomColorClick = () => {
    // Toujours initialiser avec la couleur actuelle (prédéfinie ou personnalisée)
    const currentColor = getCurrentHex()
    setCustomColor(currentColor)
    setShowCustomPicker(true)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Couleurs prédéfinies */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.values(Color).map((color) => {
          const colorHex = getColorHex(color)
          const isSelected = selectedColor === color && typeof selectedColor !== 'string'
          return (
            <button
              key={color}
              onClick={() => handlePresetColorClick(color)}
              className={`w-8 h-8 rounded-full transition-all ${
                isSelected ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: colorHex,
                '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                '--tw-ring-offset-color': backgroundColor || '#ffffff',
              } as React.CSSProperties}
              aria-label={`Sélectionner la couleur ${color}`}
              title={color}
            />
          )
        })}
        
        {/* Bouton pour ouvrir le color picker personnalisé */}
        <button
          onClick={handleCustomColorClick}
              className={`w-8 h-8 rounded-full transition-all border-2 ${textColor === 'white' ? 'border-white' : 'border-black'} ${
                showCustomPicker || (typeof selectedColor === 'string' && selectedColor.startsWith('#'))
                  ? 'ring-2 ring-offset-2 scale-110' 
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: typeof selectedColor === 'string' && selectedColor.startsWith('#') 
                  ? selectedColor 
                  : customColor,
                '--tw-ring-color': textColor === 'white' ? '#FFFFFF' : '#000000',
                '--tw-ring-offset-color': backgroundColor || '#ffffff',
              } as React.CSSProperties}
          aria-label="Choisir une couleur personnalisée"
          title="Couleur personnalisée"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        </button>
      </div>

      {/* Color picker personnalisé et affichage du code hex */}
      {showCustomPicker && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white" style={{ borderColor: borderColor }}>
          <div className="flex flex-col gap-2 flex-1">
            <label className={`text-sm font-medium ${textColor === 'white' ? 'text-white' : 'text-black'}`}>
              Couleur personnalisée
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-16 h-16 rounded cursor-pointer border-2"
                style={{ borderColor: borderColor }}
                aria-label="Sélectionner une couleur personnalisée"
              />
              <div className="flex flex-col gap-1 flex-1">
                <label className={`text-xs font-medium ${textColor === 'white' ? 'text-gray-300' : 'text-gray-600'}`}>Code hexadécimal</label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border flex-shrink-0"
                    style={{ backgroundColor: currentHex, borderColor: borderColor }}
                    aria-label={`Aperçu couleur ${currentHex}`}
                  />
                  <input
                    type="text"
                    value={currentHex.toUpperCase()}
                    readOnly
                    className={`px-3 py-2 border rounded bg-gray-50 font-mono text-sm flex-1 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
                    style={{ borderColor: borderColor }}
                    aria-label="Code hexadécimal de la couleur"
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCustomPicker(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            aria-label="Fermer le color picker"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ${textColor === 'white' ? 'text-white' : 'text-black'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Afficher le code hex même quand le picker n'est pas ouvert */}
      {!showCustomPicker && (
        <div className="flex items-center gap-2 px-4">
          <span className={`text-sm ${textColor === 'white' ? 'text-gray-300' : 'text-gray-600'}`}>Couleur actuelle :</span>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border flex-shrink-0"
              style={{ backgroundColor: currentHex, borderColor: borderColor }}
              aria-label={`Couleur ${currentHex}`}
            />
            <code className={`px-2 py-1 bg-gray-100 border rounded font-mono text-sm ${textColor === 'white' ? 'text-white' : 'text-black'}`}
              style={{ borderColor: borderColor }}
            >
              {currentHex.toUpperCase()}
            </code>
          </div>
        </div>
      )}

      {/* Sélecteur de couleur du texte */}
      {onTextColorChange && (
        <div className="flex flex-col gap-2 px-4">
          <label className={`text-sm font-medium ${textColor === 'white' ? 'text-white' : 'text-black'}`}>Couleur du texte</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTextColorChange('black')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                textColor === 'black'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              style={{
                borderColor: borderColor,
              } as React.CSSProperties}
              aria-label="Texte noir"
            >
              <div className="w-4 h-4 rounded-full bg-black border border-gray-300"></div>
              <span className="text-sm font-medium">Noir</span>
            </button>
            <button
              onClick={() => onTextColorChange('white')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                textColor === 'white'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              style={{
                borderColor: borderColor,
              } as React.CSSProperties}
              aria-label="Texte blanc"
            >
              <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
              <span className="text-sm font-medium">Blanc</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

