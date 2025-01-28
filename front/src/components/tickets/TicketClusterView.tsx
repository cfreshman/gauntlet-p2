import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { useTeams } from '../../lib/hooks/useTeams'
import type { Ticket } from '../../lib/types'

interface Point {
  id: string
  x: number
  y: number
}

interface Props {
  tickets: Array<Ticket & {
    assigned_to: string | null
    created_by: string
    team_id: string | null
    ticket_tag_links: Array<{
      ticket_tags: {
        id: string
        name: string
      }
    }> | null
  }>
}

export function TicketClusterView({ tickets }: Props) {
  const [points, setPoints] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { usernames } = useUsernames()
  const { teams } = useTeams()

  const positionTooltip = useCallback((tooltip: HTMLElement) => {
    const container = containerRef.current
    if (!container) return {}

    const containerRect = container.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const pointRect = tooltip.parentElement?.getBoundingClientRect()
    if (!pointRect) return {}

    // Calculate tooltip position if it was centered
    const centeredLeft = pointRect.left - (tooltipRect.width / 2) + (pointRect.width / 2)
    
    // If centered position would go off right edge, align to right of point
    if (centeredLeft + tooltipRect.width > containerRect.right) {
      tooltip.style.transform = 'translate(-100%, -8px)'
    }
    // If centered position would go off left edge, align to left of point
    else if (centeredLeft < containerRect.left) {
      tooltip.style.transform = 'translate(0, -8px)'
    }
    // Otherwise center it
    else {
      tooltip.style.transform = 'translate(-50%, -8px)'
    }
  }, [])

  useEffect(() => {
    async function loadCoordinates() {
      try {
        setLoading(true)
        setError('')
        const { data, error } = await supabase.functions.invoke('get-ticket-coordinates', {
          body: { ticket_ids: tickets.map(t => t.id) }
        })
        if (error) throw error
        setPoints(data.points)
      } catch (err) {
        console.error('Error loading coordinates:', err)
        setError('failed to load coordinates')
      } finally {
        setLoading(false)
      }
    }
    loadCoordinates()
  }, [tickets])

  if (error) {
    return (
      <div className="text-sm text-red-500 p-4 text-center">
        {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-sm text-primary/70 p-4 text-center">
        calculating clusters...
      </div>
    )
  }

  if (!points.length) {
    return (
      <div className="text-sm text-primary/70 p-4 text-center">
        no tickets found
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-[400px] relative bg-background border rounded-lg">
      <div className="absolute inset-6">
        {points.map(point => {
          const ticket = tickets.find(t => t.id === point.id)
          if (!ticket) return null

          return (
            <div key={point.id} className={`absolute ${hoveredId === ticket.id ? 'z-10' : 'z-0'}`} style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}>
              <Link
                to={`/tickets/${point.id}`}
                className={`block w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-colors
                  ${ticket.status === 'new' ? 'bg-blue-500 hover:bg-blue-600' :
                    ticket.status === 'open' ? 'bg-green-500 hover:bg-green-600' :
                    ticket.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
                    ticket.status === 'resolved' ? 'bg-purple-500 hover:bg-purple-600' :
                    'bg-primary hover:bg-primary'}`}
                onMouseEnter={() => setHoveredId(ticket.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
              {hoveredId === ticket.id && (
                <div 
                  ref={el => el && requestAnimationFrame(() => positionTooltip(el))}
                  className="absolute bottom-full left-0 mb-2 z-50 bg-popover border rounded-md px-3 py-1.5 text-sm text-popover-foreground shadow-md whitespace-nowrap"
                >
                  <div className="font-medium">{ticket.title}</div>
                  <div className="text-primary/70 flex gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                      ticket.status === 'open' ? 'bg-green-500/10 text-green-500' :
                      ticket.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      ticket.status === 'resolved' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-primary/10 text-primary'
                    }`}>{ticket.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                      ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                      ticket.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>{ticket.priority}</span>
                    {ticket.assigned_to && usernames[ticket.assigned_to] && (
                      <>
                        <span>·</span>
                        <span>{usernames[ticket.assigned_to]}</span>
                      </>
                    )}
                    {ticket.team_id && teams?.find(t => t.id === ticket.team_id)?.name && (
                      <>
                        <span>·</span>
                        <span>{teams.find(t => t.id === ticket.team_id)?.name}</span>
                      </>
                    )}
                  </div>
                  {ticket.ticket_tag_links && ticket.ticket_tag_links.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {ticket.ticket_tag_links.map(link => (
                        <span 
                          key={link.ticket_tags.id}
                          className="px-1.5 py-0.5 text-xs rounded-full bg-primary/10"
                        >
                          {link.ticket_tags.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 