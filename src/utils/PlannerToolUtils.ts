import { Activity } from '../models/Activity'
import { ScheduledActivity } from '../models/Planning'
import { prepareScheduledActivitiesForDay } from './PlannerActivityUtils'
import { getColorHex } from './ColorUtils'

export type PlannerMode = 'routine' | 'calendrier'

const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export function increaseZoom(current: number, step = 0.1, max = 2): number {
  return Math.min(current + step, max)
}

export function decreaseZoom(current: number, step = 0.1, min = 0.5): number {
  return Math.max(current - step, min)
}

export function getPreviousWeekStart(weekStart: Date): Date {
  const prev = new Date(weekStart)
  prev.setDate(prev.getDate() - 7)
  return prev
}

export function getNextWeekStart(weekStart: Date): Date {
  const next = new Date(weekStart)
  next.setDate(next.getDate() + 7)
  return next
}

export function formatWeekLabel(mode: PlannerMode, weekStart: Date | null): string {
  if (mode !== 'calendrier' || !weekStart) return ''
  return `Semaine du ${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

interface PrintPlannerOptions {
  mode: PlannerMode
  weekLabel: string
  weekDays: Date[]
  scheduledActivities: ScheduledActivity[]
  activities: Activity[]
  hours: number[]
  slotHeight: number
  startHour: number
}

export function printPlanner({
  mode,
  weekLabel,
  weekDays,
  scheduledActivities,
  activities,
  hours,
  slotHeight,
}: PrintPlannerOptions) {
  if (mode !== 'routine' || weekDays.length === 0) {
    window.print()
    return
  }

  const gridHeight = (hours.length + 1) * slotHeight
  const printWindow = window.open('', 'printPlanner')
  if (!printWindow) {
    window.print()
    return
  }

  const hoursColumnHtml = `
    <div class="hours-col">
      <div class="hours-header">Heures</div>
      <div class="hours-body">
        ${hours.map((hour, idx) => {
          const top = idx * slotHeight
          return `<div class="hour-label" style="top:${top}px">${hour}h</div>`
        }).join('')}
        <div class="hour-label" style="top:${hours.length * slotHeight}px">${hours[hours.length - 1] + 1}h</div>
      </div>
    </div>
  `

  const dayHtml = weekDays.map((day) => {
    const dayOfWeek = day.getDay()
    const scheduledForDay = prepareScheduledActivitiesForDay(
      scheduledActivities,
      day,
      dayOfWeek,
      null,
      activities,
      hours[0],
      slotHeight
    )

    const hourLines = hours.map((_, i) => {
      const top = i * slotHeight
      return `<div class="line" style="top:${top}px"></div>`
    }).join('') + `<div class="line" style="top:${hours.length * slotHeight}px"></div>`

    const blocks = scheduledForDay.map(({ scheduled, activity, position }) => {
      const bg = getColorHex(activity.color)
      const textColor = activity.textColor === 'white' ? '#fff' : '#000'
      return `
        <div class="block" style="
          top:${position.top}px;
          height:${position.height}px;
          left:${position.left}%;
          width:${position.width}%;
          background:${bg};
          color:${textColor};
        ">
          <div class="block-title">${activity.title}</div>
          <div class="block-time">${scheduled?.startTime || ''} - ${scheduled?.endTime || ''}</div>
        </div>
      `
    }).join('')

    const headerLabel = `${DAYS_OF_WEEK[dayOfWeek]}`

    return `
      <div class="day-col">
        <div class="day-header">${headerLabel}</div>
        <div class="day-body">
          ${hourLines}
          ${blocks}
        </div>
      </div>
    `
  }).join('')

  const titleText = weekLabel || 'Routine'

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
          <style>
          @page { size: A4 landscape; margin: 8mm; }
          body {margin: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .title { text-align: center; font-weight: 700; margin: 3mm 0 2mm; font-size: 16px; }
          .planner-print {overflow: hidden; display: flex; gap: 0; border: 1px solid #000; border-radius: 8px; padding: 0; box-sizing: content-box; outline: 1px solid #000; outline-offset: -1px; margin: 0; }
          .hours-col { width: 16px; border-right: 1px solid #000; display: flex; flex-direction: column; flex-shrink: 0; }
          .hours-header { text-align: right; padding: 4px; font-weight: 800; font-size: 12px; background: #f9fafb; color: transparent; }
          .hours-body { position: relative; height: ${gridHeight}px; background: #fff; }
          .day-col {border: 0; flex: 1; display: flex; flex-direction: column; }
          .day-col + .day-col { border-left: 1px solid #000; }
          .day-col:last-child { outline: 1px solid #000; outline-offset: -1px; }
          .day-header { text-align: center; padding: 4px; border-bottom: 1px solid #000; font-weight: 600; font-size: 12px; background: #f9fafb; }
          .day-body { position: relative; height: ${gridHeight}px; background: #fff; }
          .line { position: absolute; left: 0; right: 0; height: 0; border-top: 1px solid rgba(117, 117, 117, 0.6); }
          .hour-label { position: absolute; right: 4px; left: 0; top: 0; font-size: 9px; color: rgb(0, 0, 0); transform: translateY(-50%); text-align: right; }
          .block { position: absolute; border: 1px solid rgba(0,0,0,0.6); border-radius: 8px; font-size: 10px; padding: 2px 4px; box-sizing: border-box; overflow: hidden; }
          .block-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .block-time { font-size: 9px; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="title">${titleText}</div>
        <div class="planner-print">
          ${hoursColumnHtml}
          ${dayHtml}
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

