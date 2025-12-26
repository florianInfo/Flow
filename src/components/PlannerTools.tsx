import { useAppSettings } from '../contexts/AppSettingsContext'
import { getBorderRadiusFromSettings } from '../utils/BorderRadiusUtils'
import CalendarIcon from './CalendarIcon'
import PlannerIcon from './PlannerIcon'

type PlannerMode = 'routine' | 'calendrier'

interface PlannerToolsProps {
  currentMode: PlannerMode
  onModeChange: (mode: PlannerMode) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onPrint: () => void
  currentWeekLabel?: string
  onPreviousWeek?: () => void
  onNextWeek?: () => void
}

export default function PlannerTools({
  currentMode,
  onModeChange,
  onZoomIn,
  onZoomOut,
  onPrint,
  currentWeekLabel,
  onPreviousWeek,
  onNextWeek,
}: PlannerToolsProps) {
  const { settings } = useAppSettings()
  const borderRadiusClass = getBorderRadiusFromSettings(settings)

  const handleViewChange = (mode: PlannerMode) => {
    onModeChange(mode)
  }

  const handleZoomIn = () => {
    onZoomIn()
  }

  const handleZoomOut = () => {
    onZoomOut()
  }

  const handlePrint = () => {
    onPrint()
  }

  return (
    <div className={`w-full border-b border-black bg-white ${borderRadiusClass}`} style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <div className="flex items-center justify-between px-4 py-2 gap-4">
        {/* Section changement de vue */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewChange('routine')}
            className={`[&_*]:cursor-pointer  flex items-center justify-center p-2 transition-all ${borderRadiusClass} ${
              currentMode === 'routine'
                ? 'bg-gray-700 text-white'
                : 'bg-transparent hover:bg-gray-200 text-gray-600'
            }`}
            title="Mode Routine"
          >
            <PlannerIcon isActive={currentMode === 'routine'} />
          </button>
          <button
            onClick={() => handleViewChange('calendrier')}
            className={`[&_*]:cursor-pointer flex items-center justify-center p-2 transition-all ${borderRadiusClass} ${
              currentMode === 'calendrier'
                ? 'bg-gray-700 text-white'
                : 'bg-transparent hover:bg-gray-200 text-gray-600'
            }`}
            title="Mode Calendrier"
          >
            <CalendarIcon isActive={currentMode === 'calendrier'} />
          </button>
        </div>

        {/* Section navigation semaine */}
        <div className="flex items-center gap-2 mx-auto">
          {currentMode === 'routine' ? (
            <div className="text-sm font-semibold">Routine</div>
          ) : (
            <>
              <button
                onClick={onPreviousWeek}
                className={`px-2 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-100 transition-colors ${borderRadiusClass}`}
                title="Semaine précédente"
                disabled={!onPreviousWeek}
              >
                ←
              </button>
              <div className="text-sm font-medium whitespace-nowrap">
                {currentWeekLabel || ' '}
              </div>
              <button
                onClick={onNextWeek}
                className={`px-2 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-100 transition-colors ${borderRadiusClass}`}
                title="Semaine suivante"
                disabled={!onNextWeek}
              >
                →
              </button>
            </>
          )}
        </div>

        {/* Section zoom et impression */}
        <div className="flex items-center gap-2">
          {/* Bouton zoom moins */}
          <button
            onClick={handleZoomOut}
            className={`flex items-center justify-center p-2 transition-all ${borderRadiusClass} bg-transparent hover:bg-gray-200 text-gray-600`}
            title="Dézoomer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>

          {/* Bouton zoom plus */}
          <button
            onClick={handleZoomIn}
            className={`flex items-center justify-center p-2 transition-all ${borderRadiusClass} bg-transparent hover:bg-gray-200 text-gray-600`}
            title="Zoomer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>

          {/* Bouton impression */}
          <button
            onClick={handlePrint}
            className={`flex items-center justify-center p-2 transition-all ${borderRadiusClass} bg-transparent hover:bg-gray-200 text-gray-600`}
            title="Imprimer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

