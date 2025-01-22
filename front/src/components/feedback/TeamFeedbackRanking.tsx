import { FeedbackStatsWithUser } from '../../lib/hooks/useFeedback'
import { Link } from 'react-router-dom'

interface TeamFeedbackRankingProps {
  members: FeedbackStatsWithUser[]
}

export function TeamFeedbackRanking({ members }: TeamFeedbackRankingProps) {
  return (
    <div className="space-y-1">
      {members.map(member => (
        <Link 
          key={member.user_id} 
          to={`/tickets?assigned_id=${member.user_id}&status=closed`}
          className="flex flex-col px-2 py-1.5 rounded-sm hover:bg-primary/5"
        >
          <div className="text-sm text-primary">{member.user_name}</div>
          <div className="flex justify-between text-sm">
            <span className="text-primary/70">{member.total} ratings</span>
            <span className="text-primary">{member.average > 0 ? member.average.toFixed(1) : '-'}</span>
          </div>
        </Link>
      ))}
    </div>
  )
} 