# Core Files\n\n## Front-end Core\n
\n### Routes.tsx\n```typescript\n
import { Navigate, Routes as RouterRoutes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/hooks/useAuth';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ResetPassword } from './pages/ResetPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { TicketList } from './components/tickets/TicketList';
import { TicketCreate } from './components/tickets/TicketCreate';
import { TicketDetail } from './components/tickets/TicketDetail';
import { Logout } from './pages/Logout';
import { useEffect } from 'react';
import KnowledgeBase from './pages/kb';
import Help from './pages/help';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading...
        </div>
      </div>
    );
  }

  if (!user) {
    // Pass the current location to redirect back after login
    return <Navigate to="/signup" state={{ from: location }} />;
  }

  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home if authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return null;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function Home() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  // Show role-specific dashboard for authenticated users
  return <Dashboard />;
}

export function Routes() {
  return (
    <RouterRoutes>
      <Route path="/" element={<Home />} />
      <Route path="/help/:id" element={<Help />} />
      <Route path="/help" element={<Help />} />
      
      {/* Guest routes */}
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/signup" element={<RequireGuest><Signup /></RequireGuest>} />
      <Route path="/reset-password" element={<RequireGuest><ResetPassword /></RequireGuest>} />
      <Route path="/update-password" element={<RequireGuest><UpdatePassword /></RequireGuest>} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/settings/*" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/tickets" element={<RequireAuth><TicketList /></RequireAuth>} />
      <Route path="/tickets/new" element={<RequireAuth><TicketCreate /></RequireAuth>} />
      <Route path="/tickets/:id" element={<RequireAuth><TicketDetail /></RequireAuth>} />
      <Route path="/kb/*" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/kb/:id/edit" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/kb/new" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/logout" element={<Logout />} />
    </RouterRoutes>
  );
} \n```\n
\n### TicketList.tsx\n```typescript\n
import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ticket } from '../../lib/types'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { useTeams } from '../../lib/hooks/useTeams'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useTags } from '../../lib/hooks/useTags'
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
    ticket_tags: {
      id: string
      name: string
    }
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
  const { tags } = useTags()
  const [tickets, setTickets] = useState<TicketWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [ready, setReady] = useState(false)
  const location = useLocation()
  const [usedTags, setUsedTags] = useState<{id: string, name: string}[]>([])
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

  // Add effect to load used tags
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
      
      // Deduplicate tags
      const uniqueTags = new Map()
      data?.forEach(item => {
        const tag = item.ticket_tags
        uniqueTags.set(tag.id, tag)
      })
      setUsedTags(Array.from(uniqueTags.values()))
    }
    loadUsedTags()
  }, [])

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    const searchLower = tagSearch.toLowerCase()
    return usedTags.filter(t => t.name.toLowerCase().includes(searchLower))
  }, [usedTags, tagSearch])

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
} \n```\n
\n### TicketDetail.tsx\n```typescript\n
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ticket, TicketStatus, TicketPriority } from '../../lib/types'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { useTeamAssignment } from '../../lib/hooks/useTeamAssignment'
import { useCustomFields } from '../../lib/hooks/useCustomFields'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { CustomField } from './CustomField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { createDebouncer } from '../../lib/utils'
import { useTags } from '../../lib/hooks/useTags'
import { useTicketTags } from '../../lib/hooks/useTicketTags'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ChevronsUpDown, TrashIcon, Star } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'

interface Comment {
  id: string
  content: string
  created_at: string
  created_by: string
  internal: boolean
}

interface TicketFeedback {
  id: string
  rating: number
  comment: string | null
  created_at: string
  created_by: string
}

interface TicketWithProfile extends Ticket {
  assigned_to: string | null
  created_by: string
  team_id: string | null
  profiles: {
    username: string
  }
}

export function TicketDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const { usernames, fetchUsername } = useUsernames()
  const [ticket, setTicket] = useState<TicketWithProfile | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [feedback, setFeedback] = useState<TicketFeedback | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingTicket, setUpdatingTicket] = useState(false)
  const [updatingComment, setUpdatingComment] = useState(false)
  const { getAssignableMembers } = useTeamAssignment(profile?.id)
  const { fields, values, updateValue, loadFields } = useCustomFields(id)
  const { fields: allFields } = useFieldDefinitions()
  const [addingField, setAddingField] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState('')
  const saveDebouncer = createDebouncer()
  const { tags, createTag } = useTags()
  const { ticketTags, addTag, removeTag } = useTicketTags(id)
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [newFeedback, setNewFeedback] = useState({
    rating: 5,
    comment: ''
  })

  const isTemplate = ticket?.title.startsWith('template: ')
  const isManager = profile?.role === 'manager'
  const isManagerOrWorker = profile?.role === 'manager' || profile?.role === 'worker'
  const canLeaveFeedback = profile?.role === 'customer' && 
    ticket?.created_by === user?.id && 
    (ticket?.status === 'resolved' || ticket?.status === 'closed')

  // Add state to track if we're editing
  const [isEditing, setIsEditing] = useState(false)

  const filteredTags = useMemo(() => {
    const searchLower = tagSearch.toLowerCase()
    const filtered = tags
      .filter(t => !ticketTags.find(tt => tt.id === t.id))
      .filter(t => t.name.toLowerCase().includes(searchLower))

    if (isManager && tagSearch && !tags.find(t => t.name.toLowerCase() === tagSearch.toLowerCase())) {
      filtered.push({ id: 'create', name: `create "${tagSearch}"` })
    }

    return filtered
  }, [tags, ticketTags, tagSearch, isManager])

  useEffect(() => {
    loadTicket()
    loadComments()
    loadFeedback()

    const channel = supabase
      .channel('ticket')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Ticket changed:', payload)
          loadTicket()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${id}`
        },
        () => {
          loadComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ticket_comments',
        },
        () => {
          loadComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_feedback',
          filter: `ticket_id=eq.${id}`
        },
        () => {
          loadFeedback()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [id])

  // Load usernames when ticket/comments/feedback change
  useEffect(() => {
    if (ticket) {
      fetchUsername(ticket.created_by)
      if (ticket.assigned_to) {
        fetchUsername(ticket.assigned_to)
      }
    }

    comments.forEach(comment => {
      fetchUsername(comment.created_by)
    })

    if (feedback) {
      fetchUsername(feedback.created_by)
    }
  }, [ticket, comments, feedback])

  async function loadTicket() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTicket(data)
      setLoading(false)
    } catch (e) {
      console.error('Error loading ticket:', e)
      setError('failed to load ticket')
      setLoading(false)
    }
  }

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data)
    } catch (e) {
      console.error('Error loading comments:', e)
      setError('failed to load comments')
    }
  }

  async function loadFeedback() {
    try {
      const { data, error } = await supabase
        .from('ticket_feedback')
        .select('*')
        .eq('ticket_id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
      setFeedback(data)
      
      // Pre-fetch username for feedback
      if (data) {
        await fetchUsername(data.created_by)
      }
    } catch (e) {
      console.error('Error loading feedback:', e)
      setError('failed to load feedback')
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticket.id)
        .select()
        .single()

      if (error) throw error
      setTicket(prev => prev ? { ...prev, status } : null)
    } catch (e) {
      console.error('Error updating status:', e)
      setError('failed to update status')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handlePriorityChange(priority: TicketPriority) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          priority
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, priority } : null)
    } catch (e) {
      console.error('Error updating priority:', e)
      setError('failed to update priority')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleAssignmentChange(userId: string | null) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          assigned_to: userId
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, assigned_to: userId } : null)
    } catch (e) {
      console.error('Error updating assignment:', e)
      setError('failed to update assignment')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !ticket || !newComment.trim()) return
    setUpdatingComment(true)

    try {
      const { error } = await supabase.functions.invoke('create-comment', {
        body: {
          ticket_id: ticket.id,
          content: newComment.trim(),
          internal: isInternal,
        },
      })

      if (error) throw error
      setNewComment('')
      setIsInternal(false)
    } catch (e) {
      console.error('Error creating comment:', e)
      setError('failed to create comment')
    } finally {
      setUpdatingComment(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!user || !ticket) return
    setUpdatingTicket(true)

    try {
      const { error } = await supabase
        .from('ticket_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (e) {
      console.error('Error deleting comment:', e)
      setError('failed to delete comment')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleShareTemplate() {
    if (!ticket) return
    const url = `${window.location.origin}/tickets/new?template=${ticket.id}`
    await navigator.clipboard.writeText(url)
    alert('template URL copied to clipboard')
  }

  async function handleFieldValueChange(fieldId: string, value: string) {
    if (!user || !ticket) return
    
    // Update UI immediately
    updateValue(fieldId, value)
    
    // Debounce the save operation
    saveDebouncer.debounce(`field-${fieldId}`, async () => {
      setUpdatingTicket(true)
      
      try {
        const { error } = await supabase
          .from('ticket_field_values')
          .upsert({
            ticket_id: ticket.id,
            field_id: fieldId,
            value
          })
          .select()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
      } catch (e) {
        console.error('Error updating field value:', e)
        setError('failed to update field value')
        // Reload fields to reset UI state
        loadTicket()
      } finally {
        setUpdatingTicket(false)
      }
    })
  }

  // Clean up debouncer on unmount
  useEffect(() => {
    return () => {
      saveDebouncer.clearAll()
    }
  }, [])

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
        loading ticket...
      </div>
    </div>
  )
  if (!ticket) return <div>ticket not found</div>

  const isAssignedToMe = ticket.assigned_to === user?.id
  const canUpdateStatus = profile?.role === 'manager' || isAssignedToMe
  const assignableMembers = profile ? getAssignableMembers(profile.role) : []

  async function handleTemplateToggle() {
    if (!ticket) return
    setUpdatingTicket(true)
    
    try {
      const newTitle = isTemplate
        ? ticket.title.slice(9) // Remove prefix
        : `template: ${ticket.title}` // Add prefix

      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          title: newTitle
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, title: newTitle } : null)
    } catch (e) {
      console.error('Error updating template status:', e)
      setError('failed to update template status')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleAddField(fieldId: string) {
    if (!fieldId) return
    
    const { error } = await supabase
      .from('ticket_field_values')
      .insert({
        ticket_id: id,
        field_id: fieldId,
        value: ''
      })

    if (error) {
      console.error('Error adding field:', error)
      return
    }

    // Reload fields and ticket data
    await Promise.all([
      loadTicket(),
      loadFields()
    ])
  }

  async function handleRemoveField(fieldId: string) {
    const { error } = await supabase
      .from('ticket_field_values')
      .delete()
      .eq('ticket_id', id)
      .eq('field_id', fieldId)

    if (error) {
      console.error('Error removing field:', error)
      return
    }

    // Reload fields and ticket data
    await Promise.all([
      loadTicket(),
      loadFields()
    ])
  }

  // Add function to start editing feedback
  function handleEditFeedback() {
    if (!feedback) return
    setNewFeedback({
      rating: feedback.rating,
      comment: feedback.comment || ''
    })
    setIsEditing(true)
  }

  // Add function to cancel editing
  function handleCancelEdit() {
    setIsEditing(false)
    setNewFeedback({ rating: 5, comment: '' })
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !ticket) return
    setUpdatingTicket(true)

    try {
      if (isEditing) {
        // Update existing feedback
        const { error } = await supabase
          .from('ticket_feedback')
          .update({
            rating: newFeedback.rating,
            comment: newFeedback.comment.trim() || null
          })
          .eq('id', feedback?.id)

        if (error) throw error
      } else {
        // Create new feedback
        const { data, error } = await supabase
          .from('ticket_feedback')
          .insert({
            ticket_id: ticket.id,
            rating: newFeedback.rating,
            comment: newFeedback.comment.trim() || null
          })
          .select()
          .single()

        if (error) throw error
        
        // Pre-fetch username for new feedback
        if (data) {
          await fetchUsername(data.created_by)
        }
      }

      await loadFeedback()
      setNewFeedback({ rating: 5, comment: '' })
      setIsEditing(false)
    } catch (e) {
      console.error('Error submitting feedback:', e)
      setError('failed to submit feedback')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleClaimForTeam() {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      if (ticket.team_id) {
        // Unclaim - set team_id to null
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ team_id: null })
          .eq('id', ticket.id)

        if (updateError) throw updateError
        setTicket(prev => prev ? { ...prev, team_id: null } : null)
      } else {
        // Claim - set team_id to manager's team
        const { data: teamData, error: teamError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .single()

        if (teamError) throw teamError

        const { error: updateError } = await supabase
          .from('tickets')
          .update({ team_id: teamData.team_id })
          .eq('id', ticket.id)

        if (updateError) throw updateError
        setTicket(prev => prev ? { ...prev, team_id: teamData.team_id } : null)
      }
    } catch (e) {
      console.error('Error claiming/unclaiming ticket:', e)
      setError('failed to claim/unclaim ticket')
    } finally {
      setUpdatingTicket(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {isManager && !ticket.assigned_to && (
        <div className="mb-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClaimForTeam}
            disabled={updatingTicket}
          >
            {ticket.team_id ? 'unclaim from team' : 'claim for team'}
          </Button>
        </div>
      )}
      <div className="space-y-4">
        {/* Feedback Display */}
        {feedback && !isEditing && (
          <div className="bg-background border border-primary shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-primary">feedback</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < feedback.rating ? 'fill-yellow-500 text-yellow-500' : 'fill-primary/10 text-primary/10'}`}
                    />
                  ))}
                </div>
                {(profile?.role === 'manager' || feedback.created_by === user?.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditFeedback}
                  >
                    edit
                  </Button>
                )}
              </div>
            </div>
            {feedback.comment && feedback.comment.trim() && (
              <div className="text-primary whitespace-pre-wrap mt-4">
                {feedback.comment}
              </div>
            )}
          </div>
        )}

        {/* Feedback Form */}
        {((canLeaveFeedback && !feedback) || isEditing) && (
          <div className="bg-background border border-primary shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {isEditing ? 'edit feedback' : 'leave feedback'}
            </h2>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <span className="text-sm text-primary/70">rating</span>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewFeedback({ ...newFeedback, rating: i + 1 })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${i < newFeedback.rating ? 'fill-yellow-500 text-yellow-500' : 'fill-primary/10 text-primary/10'} hover:fill-yellow-500 hover:text-yellow-500 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-primary/70">comment (optional)</span>
                <Textarea 
                  value={newFeedback.comment}
                  onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                  placeholder="write your comment..."
                  className="w-full mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!newFeedback.rating || updatingTicket}>
                  {updatingTicket ? 'submitting...' : isEditing ? 'update feedback' : 'submit feedback'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                    cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Main Ticket Details */}
        <div className="bg-background border border-primary shadow rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">
                {isTemplate ? ticket.title.slice(9) : ticket.title}
              </h1>
              <div className="text-sm text-primary/70 flex gap-4">
                <span>by {usernames[ticket.created_by] || 'unknown'}</span>
                <span>{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {profile?.role !== 'customer' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareTemplate}
                  disabled={!isTemplate}
                >
                  share template
                </Button>
              )}
              {(profile?.role === 'manager' || (profile?.role === 'worker' && ticket.created_by === user?.id)) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTemplateToggle}
                  disabled={updatingTicket}
                >
                  {isTemplate ? 'remove template' : 'make template'}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-primary/70">status</span>
              {canUpdateStatus ? (
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">new</SelectItem>
                    <SelectItem value="open">open</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="resolved">resolved</SelectItem>
                    <SelectItem value="closed">closed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">{ticket.status}</p>
              )}
            </div>

            <div>
              <span className="text-sm text-primary/70">priority</span>
              {(profile?.role === 'manager' || (profile?.role === 'customer' && ticket.created_by === user?.id)) ? (
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => handlePriorityChange(value as TicketPriority)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                    <SelectItem value="urgent">urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">{ticket.priority}</p>
              )}
            </div>

            <div>
              <span className="text-sm text-primary/70">tags</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {ticketTags.map(tag => (
                  <div 
                    key={tag.id}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tag.name}
                    {(profile?.role === 'manager' || (profile?.role === 'worker' && ticket.assigned_to === user?.id)) && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await removeTag(tag.id)
                          } catch (e) {
                            console.error('Error removing tag:', e)
                            setError('failed to remove tag')
                          }
                        }}
                        className="text-primary/70 hover:text-primary"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {(profile?.role === 'manager' || (profile?.role === 'worker' && ticket.assigned_to === user?.id)) && (
                  <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20">
                        add tag
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-background border border-primary" align="start">
                      <Command className="w-full [&_[cmdk-input-wrapper]]:px-0">
                        <CommandInput 
                          placeholder="search tags..." 
                          className="h-9 w-full ring-0 focus:ring-0 focus-visible:ring-0 text-primary placeholder:text-primary/50" 
                          value={tagSearch} 
                          onValueChange={setTagSearch}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && tagSearch) {
                              e.preventDefault()
                              if (filteredTags.length === 1) {
                                const tag = filteredTags[0]
                                try {
                                  if (tag.id === 'create') {
                                    const newTag = await createTag(tagSearch.trim())
                                    if (newTag) {
                                      await addTag(newTag.id)
                                    }
                                  } else {
                                    await addTag(tag.id)
                                  }
                                  setTagSearchOpen(false)
                                  setTagSearch('')
                                } catch (e) {
                                  console.error('Error with tag:', e)
                                  setError('failed to handle tag')
                                }
                              }
                            }
                          }}
                        />
                        <CommandEmpty className="py-2 px-3 text-sm text-primary/50">no tags found</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {filteredTags.map(tag => (
                            <CommandItem
                              key={tag.id}
                              onSelect={async () => {
                                try {
                                  if (tag.id === 'create') {
                                    const newTag = await createTag(tagSearch.trim())
                                    if (newTag) {
                                      await addTag(newTag.id)
                                    }
                                  } else {
                                    await addTag(tag.id)
                                  }
                                  setTagSearchOpen(false)
                                  setTagSearch('')
                                } catch (e) {
                                  console.error('Error with tag:', e)
                                  setError('failed to handle tag')
                                }
                              }}
                              className={tag.id === 'create' 
                                ? "py-2 px-3 cursor-pointer hover:bg-primary/10 text-primary"
                                : "py-2 px-3 cursor-pointer hover:bg-primary/10 text-primary"}
                            >
                              {tag.id === 'create' ? `create "${tagSearch}"` : tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div>
              <span className="text-sm text-primary/70">assignee</span>
              {profile?.role === 'manager' || (profile?.role === 'worker' && (!ticket.assigned_to || ticket.assigned_to === user?.id)) ? (
                <Select
                  value={ticket.assigned_to || 'unassigned'}
                  onValueChange={(value) => handleAssignmentChange(value === 'unassigned' ? null : value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">unassigned</SelectItem>
                    {assignableMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {usernames[member.id] || member.username} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">
                  {ticket.assigned_to ? usernames[ticket.assigned_to] || 'unknown' : 'unassigned'}
                </p>
              )}
            </div>
          </div>

          {ticket.description && (
            <div className="mt-6">
              <span className="text-sm text-primary/70">description</span>
              <p className="mt-1 text-primary whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {isManager && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-primary">custom fields</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm">
                      add field
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="end">
                    <Command className="w-full">
                      <CommandInput 
                        placeholder="search fields..." 
                        className="h-9"
                      />
                      <CommandEmpty>no fields found</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {allFields
                          .filter(f => !fields.find(existing => existing.id === f.id))
                          .map(field => (
                            <CommandItem
                              key={field.id}
                              value={field.id}
                              onSelect={() => handleAddField(field.id)}
                            >
                              <span>{field.name}</span>
                              <span className="ml-2 text-xs text-primary/50">
                                ({field.type}{field.required ? ", required" : ""})
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {fields.length > 0 && (
            <div className="mt-4 space-y-4">
              {fields.map(field => (
                <div key={field.id} className="flex items-start gap-2">
                  <CustomField
                    field={field}
                    value={values[field.id] || ''}
                    onChange={(value: string) => handleFieldValueChange(field.id, value)}
                    mode={
                      profile?.role === 'customer' || 
                      (profile?.role === 'worker' && ticket.assigned_to !== user?.id) ? 
                      'view' : 'edit'
                    }
                    className="flex-1"
                  />
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field.id)}
                    >
                      remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-background border border-primary shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-primary mb-4">comments</h2>
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="border-b border-primary/20 last:border-0 pb-4">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-primary/70">
                    <span className="font-medium text-primary">{usernames[comment.created_by] || 'unknown'}</span>
                    <span className="mx-2">·</span>
                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                    {comment.internal && (
                      <>
                        <span className="mx-2">·</span>
                        <span className="text-yellow-500">internal</span>
                      </>
                    )}
                  </div>
                  {(profile?.role === 'manager' || (profile?.role === 'customer' && comment.created_by === user?.id)) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-primary whitespace-pre-wrap">{comment.content}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-primary/20">
            <h3 className="text-sm font-medium text-primary mb-4">add comment</h3>
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div>
                <Textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="write your comment..."
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.shiftKey && newComment.trim()) {
                      e.preventDefault()
                      handleSubmitComment(e)
                    }
                  }}
                />
              </div>
              {isManagerOrWorker && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="internal"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                  />
                  <Label htmlFor="internal" className="text-primary">internal comment</Label>
                </div>
              )}
              <Button type="submit" disabled={!newComment.trim() || updatingComment}>
                add comment
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} \n```\n
\n## Back-end Core\n
\n### Main Migration\n```sql\n
-- Create teams table first
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Enable RLS for teams
alter table teams enable row level security;

-- Create team members table
create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (team_id, user_id)
);

-- Enable RLS for team members
alter table team_members enable row level security;

-- Then create tickets that reference teams
create table tickets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'new',
  priority text not null default 'medium',
  restricted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  constraint valid_status check (status in ('new', 'open', 'pending', 'resolved', 'closed')),
  constraint valid_priority check (priority in ('low', 'medium', 'high', 'urgent'))
);

-- Finally create tables that reference tickets
create table ticket_comments (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  content text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table ticket_feedback (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Enable RLS
alter table tickets enable row level security;

-- Create policies
create policy "Customers can view their own tickets"
  on tickets for select
  using (created_by = auth.uid());

create policy "Everyone can view templates"
  on tickets for select
  using (title like 'template: %');

create policy "Workers can view unrestricted tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'worker'
    )
    and not restricted
  );

create policy "Managers can view all tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Assigned workers can update their tickets"
  on tickets for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

create policy "Managers can update any ticket"
  on tickets for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Workers can assign/unassign themselves"
  on tickets for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'worker'
    )
    and (
      -- Allow unassigning if currently assigned to me
      assigned_to = auth.uid()
      or
      -- Allow assigning if currently unassigned
      assigned_to is null
    )
  )
  with check (
    -- Can only set assigned_to to myself or null
    assigned_to is null 
    or 
    assigned_to = auth.uid()
  );

-- Trigger for updated_at
create trigger set_updated_at
  before update on tickets
  for each row
  execute procedure handle_updated_at();

-- After existing tickets table...

-- Enable RLS
alter table ticket_comments enable row level security;

-- Comment policies
create policy "Customers can view non-internal comments on their tickets"
  on ticket_comments for select
  using (
    not internal and
    exists (
      select 1 from tickets
      where id = ticket_id
      and created_by = auth.uid()
    )
  );

create policy "Workers can view all comments on their assigned tickets"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets
      where id = ticket_id
      and assigned_to = auth.uid()
    )
  );

create policy "Workers can view comments on viewable tickets"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets t
      join profiles p on p.id = auth.uid()
      where t.id = ticket_id
      and p.role = 'worker'
      and not t.restricted
    )
  );

create policy "Managers can view all comments"
  on ticket_comments for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Customers can comment on their tickets"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from tickets
      where id = ticket_id
      and created_by = auth.uid()
    )
  );

create policy "Workers can comment on their assigned tickets"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from tickets
      where id = ticket_id
      and assigned_to = auth.uid()
    )
  );

create policy "Managers can comment on any ticket"
  on ticket_comments for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create table ticket_tags (
  id uuid default gen_random_uuid() primary key,
  name text unique not null
);

create table ticket_tag_links (
  ticket_id uuid references tickets(id) on delete cascade,
  tag_id uuid references ticket_tags(id) on delete cascade,
  primary key (ticket_id, tag_id)
);

-- Enable RLS
alter table ticket_tags enable row level security;
alter table ticket_tag_links enable row level security;

-- Tag policies
create policy "Everyone can view tags"
  on ticket_tags for select
  using (true);

create policy "Managers can manage tags"
  on ticket_tags for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Tag link policies follow ticket visibility
create policy "Can view tags on viewable tickets"
  on ticket_tag_links for select
  using (
    exists (
      select 1 from tickets
      where id = ticket_id
      and (
        created_by = auth.uid()
        or (
          exists (
            select 1 from profiles p
            where p.id = auth.uid()
            and p.role in ('worker', 'manager')
            and (not restricted or p.role = 'manager')
          )
        )
      )
    )
  );

-- Custom fields schema
create table ticket_field_definitions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('text', 'number', 'boolean', 'date')),
  required boolean not null default false,
  created_at timestamptz not null default now(),
  owner_id uuid references auth.users(id) on delete set null
);

-- Create team field definitions link table
create table team_field_definitions (
  team_id uuid references teams(id) on delete cascade,
  field_id uuid references ticket_field_definitions(id) on delete cascade,
  primary key (team_id, field_id)
);

create table ticket_field_values (
  ticket_id uuid references tickets(id) on delete cascade,
  field_id uuid references ticket_field_definitions(id) on delete cascade,
  value text,
  created_at timestamptz not null default now(),
  primary key (ticket_id, field_id)
);

-- Enable RLS
alter table ticket_field_definitions enable row level security;
alter table team_field_definitions enable row level security;
alter table ticket_field_values enable row level security;

-- Field definition policies
create policy "Everyone can view field definitions"
  on ticket_field_definitions for select
  using (true);

create policy "Managers can create field definitions"
  on ticket_field_definitions for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Managers can update their field definitions"
  on ticket_field_definitions for update
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Managers can transfer field definition ownership"
  on ticket_field_definitions for update
  using (owner_id = auth.uid())
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
    and exists (
      select 1 from profiles
      where id = owner_id
      and role = 'manager'
    )
  );

-- Team field definition policies
create policy "Team members can view their team's field definitions"
  on team_field_definitions for select
  using (
    exists (
      select 1 from team_members
      where team_id = team_field_definitions.team_id
      and user_id = auth.uid()
    )
  );

create policy "Managers can manage their team's field definitions"
  on team_field_definitions for all
  using (
    exists (
      select 1 from team_members
      where team_id = team_field_definitions.team_id
      and user_id = auth.uid()
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

-- Field value policies
create policy "Can view field values on viewable tickets"
  on ticket_field_values for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid()
        or exists (
          select 1 from profiles p
          where p.id = auth.uid()
          and p.role in ('worker', 'manager')
          and (not t.restricted or p.role = 'manager')
        )
      )
    )
  );

create policy "Can view field values on templates"
  on ticket_field_values for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.title like 'template: %'
    )
  );

create policy "Managers can manage any field values"
  on ticket_field_values for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Workers can manage field values on team tickets"
  on ticket_field_values for all
  using (
    exists (
      select 1 from tickets t
      join team_field_definitions tfd on tfd.team_id = t.team_id
      where t.id = ticket_id
      and tfd.field_id = field_id
      and exists (
        select 1 from team_members
        where team_id = t.team_id
        and user_id = auth.uid()
        and exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'worker'
        )
      )
    )
  );

-- Skills schema
create table skills (
  id uuid default gen_random_uuid() primary key,
  name text unique not null
);

create table user_skills (
  user_id uuid references auth.users(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (user_id, skill_id)
);

create table ticket_required_skills (
  ticket_id uuid references tickets(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (ticket_id, skill_id)
);

-- Enable RLS
alter table skills enable row level security;
alter table user_skills enable row level security;
alter table ticket_required_skills enable row level security;

-- Skill policies
create policy "Everyone can view skills"
  on skills for select using (true);

-- Knowledge base schema
create table kb_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  summary text,
  storage_path text not null,
  published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table kb_article_tags (
  article_id uuid references kb_articles(id) on delete cascade,
  tag_id uuid references ticket_tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- Enable RLS
alter table kb_articles enable row level security;
alter table kb_article_tags enable row level security;

-- Article policies
create policy "Everyone can view published articles"
  on kb_articles for select
  using (published);

create policy "Workers can view all articles"
  on kb_articles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  );

create policy "Managers can manage articles"
  on kb_articles for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Article tag policies
create policy "Everyone can view article tags"
  on kb_article_tags for select
  using (true);

create policy "Managers can manage article tags"
  on kb_article_tags for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Add policy for team-based viewing
create policy "Team members can view their team's tickets"
  on tickets for select
  using (
    exists (
      select 1 from team_members
      where team_id = tickets.team_id
      and user_id = auth.uid()
    )
  );

-- Add policy for team-based updates
create policy "Team members can update their team's tickets"
  on tickets for update
  using (
    exists (
      select 1 from team_members
      where team_id = tickets.team_id
      and user_id = auth.uid()
    )
  );

-- Simple ticket creation policy
create policy "Anyone can create tickets"
  on tickets for insert
  with check (created_by = auth.uid());

-- Add update policies for tag links
create policy "Can update tags on updatable tickets"
  on ticket_tag_links for update
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add insert policies for tag links
create policy "Can insert tags on updatable tickets"
  on ticket_tag_links for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add insert/update policies for user skills
create policy "Workers can manage their own skills"
  on user_skills for all
  using (
    user_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('worker', 'manager')
    )
  );

-- Add policies for ticket required skills
create policy "Can view required skills on viewable tickets"
  on ticket_required_skills for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid()
        or (
          exists (
            select 1 from profiles p
            where p.id = auth.uid()
            and p.role in ('worker', 'manager')
            and (not t.restricted or p.role = 'manager')
          )
        )
      )
    )
  );

create policy "Can manage required skills on updatable tickets"
  on ticket_required_skills for all
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Add policies for team member management
create policy "Managers can manage team members"
  on team_members for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

-- Add delete policies for tickets
create policy "Managers can delete tickets"
  on tickets for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

-- Add delete policies for comments
create policy "Managers can delete comments"
  on ticket_comments for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Customers can delete their own comments"
  on ticket_comments for delete
  using (
    created_by = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'customer'
    )
  );

-- Add tables to realtime publication
alter publication supabase_realtime 
  add table tickets, 
  ticket_comments, 
  ticket_tags,
  ticket_tag_links,
  ticket_field_values,
  teams,
  team_members,
  skills,
  user_skills,
  ticket_required_skills,
  kb_articles,
  kb_article_tags,
  ticket_feedback,
  ticket_field_definitions,
  team_field_definitions;

-- Add missing RLS enablement
alter table ticket_feedback enable row level security;

-- Add missing feedback policies
create policy "Customers can view feedback on their tickets"
  on ticket_feedback for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

create policy "Workers can view feedback on assigned tickets"
  on ticket_feedback for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.assigned_to = auth.uid()
    )
  );

create policy "Managers can view all feedback"
  on ticket_feedback for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

create policy "Customers can add feedback to their tickets"
  on ticket_feedback for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

-- Keep this correct version at the bottom
create policy "Managers can manage skills"
  on skills for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Add missing view policy for user skills
create policy "Anyone can view user skills"
  on user_skills for select
  using (true);

-- Add missing team policies
create policy "Team members can view their teams"
  on teams for select
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = id
      and tm.user_id = auth.uid()
    )
  );

create policy "Workers can view teams they're assigned to"
  on teams for select
  using (
    exists (
      select 1 from tickets t
      where t.team_id = id
      and t.assigned_to = auth.uid()
    )
  );

-- Add missing team member policies
create policy "Everyone can view team members"
  on team_members for select
  using (true);

create policy "Managers can manage their team members"
  on team_members for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Team policies
create policy "Everyone can view teams"
  on teams for select
  using (true);

create policy "Managers can manage their teams"
  on teams for all
  using (
    exists (
      select 1 from team_members
      where user_id = auth.uid()
      and team_id = teams.id
      and exists (
        select 1 from profiles
        where id = auth.uid()
        and role = 'manager'
      )
    )
  );

create policy "Managers can delete their field definitions"
  on ticket_field_definitions for delete
  using (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'manager'
    )
  );

create policy "Can insert field values on new tickets"
  on ticket_field_values for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and t.created_by = auth.uid()
    )
  );

-- Add delete policies for tag links
create policy "Can delete tags on updatable tickets"
  on ticket_tag_links for delete
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (
        assigned_to = auth.uid()
        or exists (
          select 1 from team_members
          where team_id = t.team_id
          and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid()
          and role = 'manager'
        )
      )
    )
  );

-- Create KB bucket
INSERT INTO storage.buckets (id, name)
VALUES ('kb', 'kb')
ON CONFLICT DO NOTHING;

-- KB Storage Policies
CREATE POLICY "Anyone can read published articles"
ON storage.objects FOR SELECT
USING (bucket_id = 'kb' AND EXISTS (
  SELECT 1 FROM kb_articles
  WHERE storage_path = name
  AND published = true
));

CREATE POLICY "Staff can read all articles"
ON storage.objects FOR SELECT
USING (bucket_id = 'kb' AND EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
  AND role IN ('worker', 'manager')
));

CREATE POLICY "Staff can manage articles"
ON storage.objects FOR ALL
USING (bucket_id = 'kb' AND EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
  AND role IN ('worker', 'manager')
));

-- Add update/delete policies for feedback
create policy "Customers can update their own feedback"
  on ticket_feedback for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Managers can update any feedback"
  on ticket_feedback for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

create policy "Customers can delete their own feedback"
  on ticket_feedback for delete
  using (created_by = auth.uid());

create policy "Managers can delete any feedback"
  on ticket_feedback for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- Add auth triggers for created_by fields
create trigger set_ticket_feedback_created_by
  before insert on ticket_feedback
  for each row
  execute function handle_auth_user();
\n```\n
