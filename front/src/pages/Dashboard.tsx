import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { FeedbackBarGraph } from '../components/feedback/FeedbackBarGraph'
import { TeamFeedbackRanking } from '../components/feedback/TeamFeedbackRanking'
import { useFeedback } from '../lib/hooks/useFeedback'
import { TicketSummary } from '../components/dashboard/TicketSummary'

interface TicketCounts {
  total: number
  new: number
  new_assigned: number
  open: number
  pending: number
  resolved: number
  recently_closed: number
  urgent: number
  high: number
  assigned: number
  unassigned: number
}

export function Dashboard() {
  const { profile, loading: profileLoading } = useAuth()
  const { loading: feedbackLoading, personalStats, teamStats, teamMemberStats } = useFeedback()
  const [counts, setCounts] = useState<TicketCounts>({
    total: 0,
    new: 0,
    new_assigned: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    recently_closed: 0,
    urgent: 0,
    high: 0,
    assigned: 0,
    unassigned: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profileLoading && profile) {
      loadCounts()

      // Subscribe to ticket changes
      const channel = supabase
        .channel('dashboard_tickets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
          },
          () => {
            loadCounts()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [profile, profileLoading])

  if (loading && profileLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading dashboard...
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading profile...
        </div>
      </div>
    )
  }

  const loadCounts = async () => {
    try {
      // Get date 7 days ago
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Only check team membership for workers
      let teamData = null
      if (profile.role === 'worker' || profile.role === 'manager') {
        const { data, error: teamError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', profile.id)
          .single()

        if (teamError && teamError.code !== 'PGRST116') throw teamError // PGRST116 is "no rows returned"
        teamData = data

        // Workers need a team
        if (!teamData && profile.role === 'worker') {
          setError('no team assigned')
          return
        }
      }

      // Base query will respect RLS policies
      const { data, error } = await supabase
        .from('tickets')
        .select('status, priority, assigned_to, updated_at, title, team_id, created_by')
        .not('title', 'like', 'template:%')

      if (error) throw error

      if (data) {
        // Filter tickets based on role
        let relevantTickets = []
        let activeTickets = []

        if (profile.role === 'customer') {
          // For customers, show their own tickets
          relevantTickets = data.filter(t => t.created_by === profile.id)
          activeTickets = relevantTickets.filter(t => t.status !== 'closed')
          const incompleteTickets = relevantTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed')

          setCounts({
            total: incompleteTickets.length,
            new: activeTickets.filter(t => t.status === 'new').length,
            new_assigned: 0,
            open: activeTickets.filter(t => t.status === 'open').length,
            pending: activeTickets.filter(t => t.status === 'pending').length,
            resolved: relevantTickets.filter(t => t.status === 'resolved').length,
            recently_closed: relevantTickets.filter(t => 
              t.status === 'closed' && 
              new Date(t.updated_at) >= sevenDaysAgo
            ).length,
            urgent: activeTickets.filter(t => t.priority === 'urgent').length,
            high: activeTickets.filter(t => t.priority === 'high').length,
            assigned: activeTickets.filter(t => t.assigned_to !== null).length,
            unassigned: relevantTickets.filter(t => t.assigned_to === null).length
          })
        } else {
          // For workers/managers, show team tickets
          relevantTickets = data.filter(t => t.team_id === teamData?.team_id)
          activeTickets = relevantTickets.filter(t => t.status !== 'closed')

          const unclaimedTeamTickets = activeTickets.filter(t => t.assigned_to === null)
          const noTeamTickets = data.filter(t => t.team_id === null)
          const activeNoTeamTickets = noTeamTickets.filter(t => t.status !== 'closed')
          const myTickets = activeTickets.filter(t => t.assigned_to === profile.id)

          setCounts({
            total: activeTickets.length,
            new: profile.role === 'manager' ? activeTickets.filter(t => t.status === 'new').length : myTickets.filter(t => t.status === 'new').length,
            new_assigned: myTickets.filter(t => t.status === 'new').length,
            open: profile.role === 'manager' ? activeTickets.filter(t => t.status === 'open').length : myTickets.filter(t => t.status === 'open').length,
            pending: profile.role === 'manager' ? activeTickets.filter(t => t.status === 'pending').length : myTickets.filter(t => t.status === 'pending').length,
            resolved: profile.role === 'manager' ? relevantTickets.filter(t => t.status === 'resolved').length : myTickets.filter(t => t.status === 'resolved').length,
            recently_closed: profile.role === 'manager' ? relevantTickets.filter(t => 
              t.status === 'closed' && 
              new Date(t.updated_at) >= sevenDaysAgo
            ).length : myTickets.filter(t => 
              t.status === 'closed' && 
              new Date(t.updated_at) >= sevenDaysAgo
            ).length,
            urgent: profile.role === 'manager' ? activeTickets.filter(t => t.priority === 'urgent').length : myTickets.filter(t => t.priority === 'urgent').length,
            high: profile.role === 'manager' ? activeTickets.filter(t => t.priority === 'high').length : myTickets.filter(t => t.priority === 'high').length,
            assigned: myTickets.length,
            unassigned: profile.role === 'manager' ? activeNoTeamTickets.length : unclaimedTeamTickets.length
          })
        }
      }
    } catch (e) {
      console.error('Error loading counts:', e)
      setError('failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            {error === 'no team assigned' && profile.role === 'worker' && (
              <div className="text-primary/70">
                please wait to be assigned to a team by a manager
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (profile.role === 'manager') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">dashboard</h1>
          <div className="flex gap-2">
            <Link to="/tickets/new">
              <Button>new ticket</Button>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <TicketSummary />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">team statuses</h2>
            <div className="space-y-2">
              <Link to="/tickets?status=new&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">new</span>
                <span className="text-primary">{counts.new}</span>
              </Link>
              <Link to="/tickets?status=open&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">open</span>
                <span className="text-primary">{counts.open}</span>
              </Link>
              <Link to="/tickets?status=pending&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">pending</span>
                <span className="text-primary">{counts.pending}</span>
              </Link>
              <Link to="/tickets?status=resolved&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">resolved</span>
                <span className="text-primary">{counts.resolved}</span>
              </Link>
              <Link to="/tickets?status=closed&assigned=my-team&view=tickets&closed_after=7d" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">recently closed</span>
                <span className="text-primary">{counts.recently_closed}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">priorities</h2>
            <div className="space-y-2">
              <Link to="/tickets?priority=urgent&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-red-500/5">
                <span className="text-red-500">urgent</span>
                <span className="text-red-500">{counts.urgent}</span>
              </Link>
              <Link to="/tickets?priority=high&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-orange-500/5">
                <span className="text-orange-500">high</span>
                <span className="text-orange-500">{counts.high}</span>
              </Link>
              <Link to="/tickets?assigned=unassigned&status=active&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">unassigned</span>
                <span className="text-primary">{counts.unassigned}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">team feedback</h2>
            {feedbackLoading ? (
              <div className="text-sm text-primary/70">loading feedback...</div>
            ) : (
              <FeedbackBarGraph stats={teamStats} />
            )}
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">member ratings</h2>
            {feedbackLoading ? (
              <div className="text-sm text-primary/70">loading ratings...</div>
            ) : (
              <TeamFeedbackRanking members={teamMemberStats} />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (profile.role === 'worker') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">dashboard</h1>
          <div className="flex gap-2">
            <Link to="/tickets/new">
              <Button>new ticket</Button>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <TicketSummary />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">ticket overview</h2>
            <div className="space-y-2">
              <Link to="/tickets?status=new&assigned=my-team&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">new team tickets</span>
                <span className="text-primary">{counts.new}</span>
              </Link>
              <Link to={`/tickets?assigned=me&status=active&view=tickets`} className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">assigned to me</span>
                <span className="text-primary">{counts.assigned}</span>
              </Link>
              <Link to={`/tickets?priority=urgent&assigned=me&status=active&view=tickets`} className="flex justify-between px-2 py-1 rounded-md hover:bg-red-500/5">
                <span className="text-red-500">urgent</span>
                <span className="text-red-500">{counts.urgent}</span>
              </Link>
              <Link to={`/tickets?priority=high&assigned=me&status=active&view=tickets`} className="flex justify-between px-2 py-1 rounded-md hover:bg-orange-500/5">
                <span className="text-orange-500">high</span>
                <span className="text-orange-500">{counts.high}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">ticket status</h2>
            <div className="space-y-2">
              <Link to="/tickets?status=new&assigned=me&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">new</span>
                <span className="text-primary">{counts.new_assigned}</span>
              </Link>
              <Link to="/tickets?status=open&assigned=me&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">open</span>
                <span className="text-primary">{counts.open}</span>
              </Link>
              <Link to="/tickets?status=pending&assigned=me&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">pending</span>
                <span className="text-primary">{counts.pending}</span>
              </Link>
              <Link to="/tickets?status=resolved&assigned=me&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">resolved</span>
                <span className="text-primary">{counts.resolved}</span>
              </Link>
              <Link to="/tickets?status=closed&assigned=me&closed_after=7d&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">recently closed</span>
                <span className="text-primary">{counts.recently_closed}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">my feedback</h2>
            {feedbackLoading ? (
              <div className="text-sm text-primary/70">loading feedback...</div>
            ) : (
              <FeedbackBarGraph stats={personalStats} />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Customer view
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">my tickets</h1>
        <div className="flex gap-2">
          <Link to="/tickets/new">
            <Button>new ticket</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-background border border-primary shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-primary mb-4">ticket status</h2>
          <div className="space-y-2">
            <Link to="/tickets?status=incomplete&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
              <span className="text-primary">incomplete tickets</span>
              <span className="text-primary">{counts.total}</span>
            </Link>
            <Link to="/tickets?status=resolved&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
              <span className="text-primary">resolved</span>
              <span className="text-primary">{counts.resolved}</span>
            </Link>
            <Link to="/tickets?status=closed&closed_after=7d&view=tickets" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
              <span className="text-primary">recently closed</span>
              <span className="text-primary">{counts.recently_closed}</span>
            </Link>
          </div>
        </div>

        <div className="bg-background border border-primary shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-primary mb-4">quick actions</h2>
          <div className="space-y-4">
            <Link to="/tickets/new" className="block">
              <Button className="w-full">create ticket</Button>
            </Link>
            <Link to="/tickets" className="block">
              <Button variant="outline" className="w-full">view tickets</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 