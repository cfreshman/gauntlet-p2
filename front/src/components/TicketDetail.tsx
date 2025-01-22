import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useUsernames } from '../lib/hooks/useUsernames'

interface TicketFeedback {
  id: string
  rating: number
  comment: string | null
  created_by: string
  created_at: string
  ticket_id: string
}

export function TicketDetail({ id }: { id: string }) {
  const { usernames, fetchUsername } = useUsernames()
  const [feedback, setFeedback] = useState<TicketFeedback | null>(null)
  
  // Load feedback and username
  useEffect(() => {
    async function loadFeedback() {
      try {
        const { data, error } = await supabase
          .from('ticket_feedback')
          .select('*')
          .eq('ticket_id', id)
          .single()

        if (error) throw error
        setFeedback(data)
        
        // Pre-fetch username for feedback
        if (data) {
          await fetchUsername(data.created_by)
        }
      } catch (error) {
        console.error('Error loading feedback:', error)
      }
    }

    loadFeedback()
  }, [id, fetchUsername])

  // In the feedback display section:
  {feedback && (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-4 w-4',
                star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              )}
            />
          ))}
        </div>
        <span className="text-sm text-primary/70">
          by {usernames[feedback.created_by] || 'loading...'}
        </span>
      </div>
      {feedback.comment && (
        <p className="text-sm">{feedback.comment}</p>
      )}
    </div>
  )} 