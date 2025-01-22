import { FeedbackStats } from '../../lib/hooks/useFeedback'

interface FeedbackBarGraphProps {
  stats: FeedbackStats
  title?: string
}

export function FeedbackBarGraph({ stats, title }: FeedbackBarGraphProps) {
  // Find the max count to scale bars
  const maxCount = Math.max(...Object.values(stats.distribution))
  
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium text-primary">{title}</h3>}
      
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = stats.distribution[rating as 1|2|3|4|5]
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
          
          return (
            <div key={rating} className="flex items-center gap-2">
              <div className="w-4 text-sm text-primary">{rating}</div>
              <div className="flex-1 h-6 bg-primary/10 rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-8 text-sm text-primary text-right">{count}</div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between text-sm text-primary/70 pt-2">
        <div>average: {stats.average.toFixed(1)}</div>
        <div>total: {stats.total}</div>
      </div>
    </div>
  )
} 