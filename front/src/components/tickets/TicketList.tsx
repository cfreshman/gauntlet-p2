import { useEffect, useState } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ticket } from '../../lib/types'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'

interface TicketWithProfile extends Ticket {
  assigned_to: string | null
  created_by: string
}

type SortField = 'created_at' | 'priority' | 'status'
type SortOrder = 'asc' | 'desc'

const FILTER_STORAGE_KEY = 'ticket-filters'

// Add status and priority order maps
const STATUS_ORDER = {
  new: 0,
  open: 1,
  pending: 2,
  resolved: 3,
  closed: 4
}

const PRIORITY_ORDER = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3
}

export function TicketList() {
  const { profile, user } = useAuth()
  const { usernames, fetchUsername } = useUsernames()
  const [tickets, setTickets] = useState<TicketWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const location = useLocation()

  // Restore filters from storage if URL is empty
  useEffect(() => {
    if (location.search === '') {
      const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY)
      if (storedFilters) {
        setSearchParams(new URLSearchParams(storedFilters))
      }
    }
    setReady(true)
  }, []) // Only run on mount

  const viewMode = searchParams.get('view') || 'tickets'
  const statusFilter = searchParams.get('status') || 'all'
  const priorityFilter = searchParams.get('priority') || 'all'
  const sortField = (searchParams.get('sort') as SortField) || 'created_at'
  const sortOrder = (searchParams.get('order') as SortOrder) || 'desc'
  const assignedFilter = searchParams.get('assigned') || null
  const closedAfter = searchParams.get('closed_after') || null

  // Update URL params helper
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    setSearchParams(newParams)
    // Store the filter configuration
    localStorage.setItem(FILTER_STORAGE_KEY, newParams.toString())
  }

  // Toggle assigned to me
  const toggleAssigned = (checked: boolean) => {
    if (!user) return
    updateParams({ assigned: checked ? user.id : null })
  }

  // Load usernames when tickets change
  useEffect(() => {
    const userIds = new Set<string>()
    tickets.forEach(ticket => {
      userIds.add(ticket.created_by)
      if (ticket.assigned_to) userIds.add(ticket.assigned_to)
    })

    userIds.forEach(userId => {
      fetchUsername(userId)
    })
  }, [tickets])

  // Load tickets when filters change
  useEffect(() => {
    if (!ready) return
    loadTickets()

    // Subscribe to changes
    const channel = supabase
      .channel('tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          // Reload all tickets when any change occurs
          loadTickets()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [searchParams, ready]) // Only load when ready and params change

  async function loadTickets() {
    try {
      let query = supabase
        .from('tickets')
        .select('*')

      // Show either templates or regular tickets
      if (profile?.role !== 'customer') {
        if (viewMode === 'templates') {
          query = query.like('title', 'template:%')
        } else {
          query = query.not('title', 'like', 'template:%')
        }
      } else {
        // Customers never see templates
        query = query.not('title', 'like', 'template:%')
      }

      // Apply filters
      if (statusFilter === 'active') {
        query = query.neq('status', 'closed')
      } else if (statusFilter === 'closed' && closedAfter === '7d') {
        // Get date 7 days ago
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        query = query
          .eq('status', 'closed')
          .gte('updated_at', sevenDaysAgo.toISOString())
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter)
      }
      if (assignedFilter === 'null') {
        query = query.is('assigned_to', null)
      } else if (assignedFilter) {
        query = query.eq('assigned_to', assignedFilter)
      }

      // Apply sorting
      if (sortField === 'status') {
        // Get all tickets and sort in memory for status
        query = query.order('created_at', { ascending: false })
        const { data, error } = await query
        if (error) throw error
        
        const sortedData = [...data].sort((a, b) => {
          const aOrder = STATUS_ORDER[a.status as keyof typeof STATUS_ORDER]
          const bOrder = STATUS_ORDER[b.status as keyof typeof STATUS_ORDER]
          return sortOrder === 'asc' ? aOrder - bOrder : bOrder - aOrder
        })
        setTickets(sortedData)
      } else if (sortField === 'priority') {
        // Get all tickets and sort in memory for priority
        query = query.order('created_at', { ascending: false })
        const { data, error } = await query
        if (error) throw error
        
        const sortedData = [...data].sort((a, b) => {
          const aOrder = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER]
          const bOrder = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER]
          return sortOrder === 'asc' ? aOrder - bOrder : bOrder - aOrder
        })
        setTickets(sortedData)
      } else {
        // For created_at, use database sorting
        query = query.order(sortField, { ascending: sortOrder === 'asc' })
        const { data, error } = await query
        if (error) throw error
        setTickets(data)
      }
    } catch (e) {
      console.error('Error loading tickets:', e)
      setError('failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-32 text-primary/70">
        loading tickets...
      </div>
    </div>
  )
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-32 text-red-500">
        {error}
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary">
            {viewMode === 'templates' ? 'templates' : 'tickets'}
          </h1>
          {assignedFilter && assignedFilter !== user?.id && assignedFilter !== 'null' && (
            <span className="text-2xl text-primary/90">
              assigned to {usernames[assignedFilter] || 'unknown'}
            </span>
          )}
          {assignedFilter === 'null' && (
            <span className="text-2xl text-primary/90">unassigned</span>
          )}
        </div>
        <div className="flex gap-2">
          {profile?.role !== 'customer' && (
            <Link to={`/tickets?${new URLSearchParams({
              ...Object.fromEntries(searchParams),
              view: viewMode === 'templates' ? 'tickets' : 'templates'
            })}`}>
              <Button variant="outline">
                view {viewMode === 'templates' ? 'tickets' : 'templates'}
              </Button>
            </Link>
          )}
          <Link to="/tickets/new">
            <Button>new ticket</Button>
          </Link>
        </div>
      </div>

      {profile?.role !== 'customer' && (
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm text-primary/70 mb-1">status</label>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => updateParams({ status: value === 'all' ? null : value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="new">new</SelectItem>
                <SelectItem value="open">open</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="resolved">resolved</SelectItem>
                <SelectItem value="closed">closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-primary/70 mb-1">priority</label>
            <Select 
              value={priorityFilter} 
              onValueChange={(value) => updateParams({ priority: value === 'all' ? null : value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="medium">medium</SelectItem>
                <SelectItem value="high">high</SelectItem>
                <SelectItem value="urgent">urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-primary/70 mb-1">sort by</label>
            <Select 
              value={sortField} 
              onValueChange={(value) => updateParams({ sort: value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">created</SelectItem>
                <SelectItem value="priority">priority</SelectItem>
                <SelectItem value="status">status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-primary/70 mb-1">order</label>
            <Select 
              value={sortOrder} 
              onValueChange={(value) => updateParams({ order: value })}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">ascending</SelectItem>
                <SelectItem value="desc">descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="block text-sm text-primary/70 mb-1">&nbsp;</div>
            <div className="flex items-center gap-2 h-9">
              <Switch
                checked={user ? assignedFilter === user.id : false}
                onCheckedChange={toggleAssigned}
              />
              <span className="text-sm text-primary/70">assigned to me</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-background border border-primary shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-primary/20">
          {tickets.length > 0 ? (
            tickets.map(ticket => (
              <div key={ticket.id} className="hover:bg-primary/5 p-4">
                <Link 
                  to={`/tickets/${ticket.id}`}
                  className="block"
                >
                  <div className="text-lg font-medium text-primary hover:text-primary/90 mb-1">
                    {ticket.title}
                  </div>
                  <div className="text-sm text-primary/70 flex gap-4">
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
                    <span>by {usernames[ticket.created_by] || 'unknown'}</span>
                    <span>
                      {ticket.assigned_to ? (
                        <Link 
                          to={`/tickets?assigned=${ticket.assigned_to}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          assigned to {usernames[ticket.assigned_to] || 'unknown'}
                        </Link>
                      ) : 'unassigned'}
                    </span>
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-primary/70">
              no tickets found
              {(statusFilter !== 'all' || priorityFilter !== 'all' || assignedFilter) && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      updateParams({
                        status: null,
                        priority: null,
                        assigned: null
                      })
                    }}
                  >
                    clear filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 