import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import type { Ticket } from '../../lib/types'

interface SimilarTicketsProps {
  ticketId: string
  excludeTemplates?: boolean
}

interface SimilarTicket extends Ticket {
  similarity: number
}

export function SimilarTickets({ ticketId, excludeTemplates = true }: SimilarTicketsProps) {
  const [tickets, setTickets] = useState<SimilarTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSimilarTickets() {
      try {
        setLoading(true)
        setError('')

        const { data, error } = await supabase.functions.invoke('search-similar-tickets', {
          body: { ticket_id: ticketId }
        })

        if (error) throw error

        // Filter out templates if needed and the current ticket
        const filteredTickets = data.tickets
          .filter((t: SimilarTicket) => {
            if (excludeTemplates && t.title.startsWith('template:')) return false
            if (t.id === ticketId) return false
            return true
          })
          .slice(0, 5) // Show top 5 similar tickets

        setTickets(filteredTickets)
      } catch (e) {
        console.error('Error loading similar tickets:', e)
        setError('Failed to load similar tickets')
      } finally {
        setLoading(false)
      }
    }

    if (ticketId) {
      loadSimilarTickets()
    }
  }, [ticketId, excludeTemplates])

  if (loading) {
    return (
      <div className="text-sm text-primary/70">
        loading similar tickets...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        {error}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-sm text-primary/70">
        no similar tickets found
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tickets.map(ticket => (
        <Link
          key={ticket.id}
          to={`/tickets/${ticket.id}`}
          className="block p-2 rounded hover:bg-primary/5"
        >
          <div className="text-sm font-medium text-primary">
            {ticket.title}
            <span className="ml-2 text-xs text-primary/70">
              {Math.round(ticket.similarity * 100)}% match
            </span>
          </div>
          <div className="text-xs text-primary/70 flex gap-2 mt-1">
            <span className={`px-1.5 py-0.5 rounded-full ${
              ticket.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
              ticket.status === 'open' ? 'bg-green-500/10 text-green-500' :
              ticket.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
              ticket.status === 'resolved' ? 'bg-purple-500/10 text-purple-500' :
              'bg-primary/10 text-primary'
            }`}>{ticket.status}</span>
            <span className={`px-1.5 py-0.5 rounded-full ${
              ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
              ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
              ticket.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
              'bg-green-500/10 text-green-500'
            }`}>{ticket.priority}</span>
          </div>
        </Link>
      ))}
    </div>
  )
} 