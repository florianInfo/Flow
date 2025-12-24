interface PlannerIconProps {
  isActive: boolean
}

export default function PlannerIcon({ isActive }: PlannerIconProps) {
  const color = isActive ? "#1f2937" : "#6b7280"
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Carnet de note */}
      <rect x="5" y="4" width="14" height="17" rx="1.5" stroke={color} strokeWidth="1.5" fill="white"/>
      {/* Spirale à gauche */}
      <circle cx="5" cy="6" r="0.8" fill={color}/>
      <circle cx="5" cy="9" r="0.8" fill={color}/>
      <circle cx="5" cy="12" r="0.8" fill={color}/>
      <circle cx="5" cy="15" r="0.8" fill={color}/>
      <circle cx="5" cy="18" r="0.8" fill={color}/>
      {/* Lignes de texte */}
      <line x1="8" y1="7" x2="15" y2="7" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="10" x2="15" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="13" x2="13" y2="13" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="14" y2="16" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

