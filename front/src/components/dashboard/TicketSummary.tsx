import { useEffect, useState } from 'react'
import { useSupabase } from '../../lib/hooks/useSupabase'
import { useAuth } from '../../lib/hooks/useAuth'
import { FormattedText } from '../ui/formatted-text'
import { Card } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { useTeam } from '../../lib/hooks/useTeam'

interface CachedSummary {
  summary: string
  ticketIds: string[]
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function TicketSummary() {
  const supabase = useSupabase()
  const { user, profile } = useAuth()
  const { team } = useTeam(user?.id)
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id || !profile || !team) return

    async function fetchSummary() {
      try {
        setLoading(true)
        setError(null)

        // Get incomplete tickets based on role
        const query = supabase
          .from('tickets')
          .select('id')
          .in('status', ['new', 'open', 'pending', 'resolved'])

        // Filter based on role
        if (profile?.role === 'manager' && team?.id) {
          query.eq('team_id', team.id)
        } else if (user?.id) {
          query.eq('assigned_to', user.id)
        }

        const { data: tickets, error: ticketsError } = await query
        if (ticketsError) throw ticketsError

        const ticketIds = tickets?.map(t => t.id) || []
        if (!ticketIds.length) {
          setSummary('no incomplete tickets found')
          setLoading(false)
          return
        }

        const cacheKey = `ticket-summary-${user?.id}`
        const cached = localStorage.getItem(cacheKey)

        if (cached) {
          const cachedData: CachedSummary = JSON.parse(cached)
          const isStale = Date.now() - cachedData.timestamp > CACHE_DURATION
          const hasSameTickets = ticketIds.length === cachedData.ticketIds.length && 
            ticketIds.every(id => cachedData.ticketIds.includes(id))

          if (!isStale && hasSameTickets) {
            setSummary(cachedData.summary)
            setLoading(false)
            return
          }
        }

        // Get fresh summary from edge function
        const { data, error } = await supabase.functions.invoke('generate-ticket-summary', {
          body: { 
            user_id: user?.id,
            ticket_ids: ticketIds
          }
        })

        if (error) throw error

        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          summary: data.summary,
          ticketIds,
          timestamp: Date.now()
        }))

        setSummary(data.summary)
      } catch (e) {
        console.error('Error fetching ticket summary:', e)
        setError('failed to load summary')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [user?.id, profile?.role, team?.id])

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-sm text-red-500">{error}</div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <FormattedText 
        text={summary} 
        className="text-sm text-primary"
      />
    </Card>
  )
} 