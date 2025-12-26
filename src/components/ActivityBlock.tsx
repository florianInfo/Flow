import React from 'react'
import { Activity } from '../models/Activity'
import { ScheduledActivity, PlannedActivity } from '../models/Planning'
import { getColorHex } from '../utils/ColorUtils'

export interface ActivityBlockProps {
  activity: Activity
  planned?: PlannedActivity
  scheduled?: ScheduledActivity
  position: {
    top: number
    height: number
    left: number
    width: number
  }
  isSelected: boolean
  isResizing?: boolean
  mode: 'routine' | 'calendrier'
  onSelect: (e: React.MouseEvent) => void
  onDoubleClick?: (e: React.MouseEvent) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onResizeStart?: (e: React.MouseEvent, edge: 'top' | 'bottom') => void
  onDelete?: () => void
  style?: React.CSSProperties
  borderRadiusClass?: string
}

export default function ActivityBlock({
  activity,
  planned,
  scheduled,
  position,
  isSelected,
  isResizing = false,
  mode,
  onSelect,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onResizeStart,
  onDelete,
  style: additionalStyle,
  borderRadiusClass = 'rounded-xl',
}: ActivityBlockProps) {
  const isScheduled = !!scheduled
  const displayActivity = planned || scheduled
  if (!displayActivity) return null

  const backgroundColor = getColorHex(activity.color)

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${position.top}px`,
    height: `${position.height}px`,
    left: `${position.left}%`,
    width: `${position.width}%`,
    backgroundColor,
    padding: '4px 8px',
    fontSize: '12px',
    opacity: isScheduled ? 0.80 : 1,
    borderWidth: isSelected ? '2px' : '1px',
    borderStyle: 'solid',
    borderColor: 'black',
    zIndex: isSelected ? 15 : isScheduled ? 5 : 10,
    cursor: isScheduled ? (isResizing ? 'ns-resize' : 'move') : 'default',
    marginLeft: position.left > 0 ? '2px' : '0',
    marginRight: position.left + position.width < 100 ? '2px' : '0',
    boxSizing: 'border-box',
    ...additionalStyle,
  }

  const title = isScheduled ? `${activity.title}` : activity.title
  const startTime = planned?.startTime || scheduled?.startTime || ''
  const endTime = planned?.endTime || scheduled?.endTime || ''

  return (
    <div
      draggable={isScheduled && !isResizing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={baseStyle}
      className={`flex flex-col justify-center relative ${borderRadiusClass}`}
      title={title}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {/* Poignée de redimensionnement en haut - uniquement pour scheduled */}
      {isScheduled && isSelected && onResizeStart && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 cursor-ns-resize z-20"
          onMouseDown={(e) => onResizeStart(e, 'top')}
          style={{
            top: '-3px',
            width: '40px',
            height: '6px',
            backgroundColor: activity.textColor === 'white' ? 'rgba(255,255,255,0.8)' : '#000000',
            borderRadius: '3px',
          }}
        />
      )}

      {/* Bouton de suppression - uniquement pour scheduled */}
      {isScheduled && isSelected && onDelete && scheduled?.id !== undefined && (
        <button
          className={`absolute top-1 right-1 z-30 ${borderRadiusClass} w-3 h-3 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity`}
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${activity.title}" de la routine ?`)) {
              onDelete()
            }
          }}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
          title="Supprimer de la routine"
        >
          ×
        </button>
      )}

      {/* Contenu de l'activité */}
      <div className={`font-medium truncate ${activity.textColor === 'white' ? 'text-white' : 'text-black'}`}>{activity.title}</div>
      <div className={`text-xs ${activity.textColor === 'white' ? 'text-gray-300' : 'text-gray-600'}`}>
        {startTime} - {endTime}
      </div>

      {/* Poignée de redimensionnement en bas - uniquement pour scheduled */}
      {isScheduled && isSelected && onResizeStart && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 cursor-ns-resize z-20"
          onMouseDown={(e) => onResizeStart(e, 'bottom')}
          style={{
            bottom: '-3px',
            width: '40px',
            height: '6px',
            backgroundColor: activity.textColor === 'white' ? 'rgba(255,255,255,0.8)' : '#000000',
            borderRadius: '3px',
          }}
        />
      )}
    </div>
  )
}

