import { Target } from 'lucide-react'

interface Props {
  title: string
  description: string
  current: number
  target: number
  color?: string
}

export default function GoalCard({ title, description, current, target, color = 'var(--color-primary)' }: Props) {
  const progress = Math.min(Math.max(current / target, 0), 1)
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="card-tint rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-surface-tint)' }}>
      <div className="flex-1 mr-4">
        <div className="flex items-center space-x-2 mb-1">
          <Target size={16} style={{ color }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
        </div>
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-second)' }}>{description}</p>
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
          สะสมได้ ฿{current.toLocaleString()} จาก ฿{target.toLocaleString()}
        </p>
      </div>

      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="32" cy="32" r={radius} stroke="var(--color-border)" strokeWidth="4" fill="none" />
          <circle 
            cx="32" 
            cy="32" 
            r={radius} 
            stroke={color} 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round"
            style={{ 
              strokeDasharray: circumference, 
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease' 
            }} 
          />
        </svg>
        <span className="absolute text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  )
}
