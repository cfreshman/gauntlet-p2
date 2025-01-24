import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ticket } from '../../lib/types'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { useTeams } from '../../lib/hooks/useTeams'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import type { Tag } from '../../lib/hooks/useTags'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ChevronsUpDown } from 'lucide-react'

interface TicketWithProfile extends Ticket {
  assigned_to: string | null
  created_by: string
  team_id: string | null
  feedback: {
    rating: number
  }[] | null
  ticket_tag_links: {
    ticket_tags: Tag
  }[] | null
}

type SortField = 'created_at' | 'priority' | 'status'
type SortOrder = 'asc' | 'desc'
type AssignedFilter = 'any' | 'unassigned' | 'my-team' | 'me'

const FILTER_STORAGE_KEY = 'ticket-filters'

// Add status and priority order maps
const STATUS_ORDER = {
  new: 0,
  open: 1,
  pending: 2,
  resolved: 3,
  closed: 4
} as const

const PRIORITY_ORDER = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3
} as const

export function TicketList() {
  const { profile, user } = useAuth()
  const { usernames, fetchUsername } = useUsernames()
  const { teams } = useTeams()
  const [tickets, setTickets] = useState<TicketWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const location = useLocation()
  const [usedTags, setUsedTags] = useState<Tag[]>([])
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')

  // Restore filters from storage if URL is empty
  useEffect(() => {
    if (location.search === '') {
      // Set role-specific defaults if no stored filters
      const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY)
      if (storedFilters && profile?.role !== 'customer') {
        setSearchParams(new URLSearchParams(storedFilters))
      } else if (profile?.role === 'worker') {
        // Workers default: active tickets assigned to me, sorted by priority
        setSearchParams(new URLSearchParams({
          assigned: 'me',
          status: 'active',
          sort: 'priority',
          order: 'asc',
          view: 'tickets'
        }))
      } else if (profile?.role === 'manager') {
        // Managers default: show unassigned and new tickets first, sorted by priority
        setSearchParams(new URLSearchParams({
          status: 'active',
          assigned: 'unassigned',
          sort: 'priority',
          order: 'asc',
          view: 'tickets'
        }))
      }
      // Customers have no URL params - they see all their tickets sorted by date
    }
    setReady(true)
  }, [profile?.role, user?.id]) // Run when role/user changes

  // Let customers use URL params like everyone else
  const viewMode = searchParams.get('view') || 'tickets'
  const statusFilter = searchParams.get('status') || 'all'
  const priorityFilter = searchParams.get('priority') || 'all'
  const sortField = (searchParams.get('sort') as SortField) || 'created_at'
  const sortOrder = (searchParams.get('order') as SortOrder) || 'desc'
  const assignedFilter = (searchParams.get('assigned') as AssignedFilter) || 'any'
  const assignedId = searchParams.get('assigned_id')
  const closedAfter = searchParams.get('closed_after') || null
  const teamId = searchParams.get('team_id')
  const tagFilter = searchParams.get('tag') || 'all'

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

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    const searchLower = tagSearch.toLowerCase()
    return usedTags.filter(t => t.name.toLowerCase().includes(searchLower))
  }, [usedTags, tagSearch])

  // Update tag filtering
  useEffect(() => {
    async function loadUsedTags() {
      const { data } = await supabase
        .from('ticket_tag_links')
        .select(`
          ticket_tags (
            id,
            name
          )
        `)
        .order('ticket_tags(name)')
        .returns<{ ticket_tags: { id: string; name: string } | null }[]>()
      
      // Deduplicate tags
      const uniqueTags = new Map<string, Tag>()
      if (data) {
        data.forEach(item => {
          if (item.ticket_tags) {
            uniqueTags.set(item.ticket_tags.id, {
              id: item.ticket_tags.id,
              name: item.ticket_tags.name
            })
          }
        })
      }
      setUsedTags(Array.from(uniqueTags.values()))
    }
    loadUsedTags()
  }, [])

  async function loadTickets() {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('tickets')
        .select(`
          *,
          feedback:ticket_feedback (
            rating
          ),
          ticket_tag_links!${tagFilter !== 'all' ? 'inner' : 'left'} (
            ticket_tags (
              id,
              name
            )
          )
        `)

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
      } else if (statusFilter === 'unresolved') {
        query = query.not('status', 'in', '(resolved,closed)')
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

      // Handle team_id filter
      if (teamId) {
        query = query.eq('team_id', teamId)
      }

      // Handle assignment filter
      if (assignedId) {
        query = query.eq('assigned_to', assignedId)
      } else if (assignedFilter === 'unassigned') {
        query = query.is('assigned_to', null)
      } else if (assignedFilter === 'me' && user) {
        query = query.eq('assigned_to', user.id)
      } else if (assignedFilter === 'my-team' && user) {
        // Get user's team first
        const { data: teamData } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .single()

        if (teamData?.team_id) {
          query = query.eq('team_id', teamData.team_id)
        }
      }
      // 'any' shows all tickets (no filter)

      // Apply tag filter
      if (tagFilter !== 'all') {
        query = query
          .eq('ticket_tag_links.tag_id', tagFilter)
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
      setError('Failed to load tickets')
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
            {profile?.role === 'customer' && (statusFilter !== 'all' || (searchParams.toString() !== '' && searchParams.toString() !== 'view=tickets'))
              ? 'filtered tickets'
              : viewMode === 'templates' ? 'templates' : 'tickets'}
          </h1>
          {profile?.role !== 'customer' && (
            <>
              {assignedId ? (
                <span className="text-2xl text-primary/90">
                  assigned to {usernames[assignedId] || 'loading...'}
                </span>
              ) : teamId ? (
                <span className="text-2xl text-primary/90">
                  assigned to {teams?.find(t => t.id === teamId)?.name || 'loading...'} team
                </span>
              ) : (
                <>
                  {assignedFilter === 'me' && (
                    <span className="text-2xl text-primary/90">
                      my tickets
                    </span>
                  )}
                  {assignedFilter === 'my-team' && (
                    <span className="text-2xl text-primary/90">
                      team tickets
                    </span>
                  )}
                  {assignedFilter === 'unassigned' && (
                    <span className="text-2xl text-primary/90">unassigned</span>
                  )}
                </>
              )}
            </>
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
                <SelectItem value="unresolved">unresolved</SelectItem>
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
            <label className="block text-sm text-primary/70 mb-1">tag</label>
            <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tagSearchOpen}
                  className="w-[120px] justify-between"
                >
                  {tagFilter === 'all' 
                    ? 'all'
                    : usedTags.find(t => t.id === tagFilter)?.name || 'select...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="search tags..." 
                    value={tagSearch}
                    onValueChange={setTagSearch}
                  />
                  <CommandEmpty>no tags found</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        updateParams({ tag: null })
                        setTagSearchOpen(false)
                        setTagSearch('')
                      }}
                    >
                      all
                    </CommandItem>
                    {filteredTags.map(tag => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => {
                          updateParams({ tag: tag.id })
                          setTagSearchOpen(false)
                          setTagSearch('')
                        }}
                      >
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
            <label className="block text-sm text-primary/70 mb-1">assigned to</label>
            <Select
              value={assignedId || teamId || assignedFilter}
              onValueChange={(value) => {
                const params = new URLSearchParams(searchParams)
                
                // Clear both assigned_id and team_id when selecting standard options
                if (['any', 'unassigned', 'my-team', 'me'].includes(value)) {
                  params.delete('assigned_id')
                  params.delete('team_id') 
                  params.set('assigned', value)
                }
                // Clear the other param when setting one
                else if (value === assignedId) {
                  params.delete('assigned_id')
                  params.delete('assigned')
                }
                else if (value === teamId) {
                  params.delete('team_id')
                  params.delete('assigned') 
                }
                setSearchParams(params)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="assigned to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">any</SelectItem>
                <SelectItem value="unassigned">unassigned</SelectItem>
                <SelectItem value="my-team">my team</SelectItem>
                <SelectItem value="me">just me</SelectItem>
                {assignedId && usernames[assignedId] && (
                  <SelectItem value={assignedId}>{usernames[assignedId]}</SelectItem>
                )}
                {teamId && teams?.find(t => t.id === teamId)?.name && (
                  <SelectItem value={teamId}>{teams.find(t => t.id === teamId)?.name} team</SelectItem>
                )}
              </SelectContent>
            </Select>
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
                        <>
                          assigned to{' '}
                          <Link 
                            to={`/tickets?assigned_id=${ticket.assigned_to}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {usernames[ticket.assigned_to] || 'unknown'}
                          </Link>
                          {ticket.team_id && teams?.find(t => t.id === ticket.team_id)?.name && (
                            <>, {' '}
                              <Link
                                to={`/tickets?team_id=${ticket.team_id}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {teams.find(t => t.id === ticket.team_id)?.name}
                              </Link>
                            </>
                          )}
                        </>
                      ) : 'unassigned'}
                    </span>
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    {ticket.feedback?.[0] && (
                      <span className="text-primary">
                        {ticket.feedback[0].rating} ★
                      </span>
                    )}
                    {ticket.ticket_tag_links?.slice(0, 3).map(link => (
                      <Link
                        key={link.ticket_tags.id}
                        to={`/tickets?tag=${link.ticket_tags.id}`}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.ticket_tags.name}
                      </Link>
                    ))}
                    {ticket.ticket_tag_links && ticket.ticket_tag_links.length > 3 && (
                      <span className="text-xs text-primary/70">
                        +{ticket.ticket_tag_links.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-primary/70">
              no tickets found
              {(statusFilter !== 'all' || priorityFilter !== 'all' || assignedFilter || tagFilter !== 'all') && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      updateParams({
                        status: null,
                        priority: null,
                        assigned: null,
                        tag: null
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