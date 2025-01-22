import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'

interface TicketCounts {
  total: number
  new: number
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
  const { profile } = useAuth()
  const [counts, setCounts] = useState<TicketCounts>({
    total: 0,
    new: 0,
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
    loadCounts()
  }, [])

  async function loadCounts() {
    try {
      // Get date 7 days ago
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // First get the user's team
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile?.id)
        .single()

      if (teamError && teamError.code !== 'PGRST116') throw teamError // PGRST116 is "no rows returned"

      // Base query will respect RLS policies
      const { data, error } = await supabase
        .from('tickets')
        .select('status, priority, assigned_to, updated_at, title, team_id')
        .not('title', 'like', 'template:%')

      if (error) throw error

      if (data) {
        // For managers: show unassigned tickets and team tickets
        const teamTickets = data.filter(t => t.team_id === teamData?.team_id)
        const activeTeamTickets = teamTickets.filter(t => t.status !== 'closed' && t.status !== 'resolved')
        const unassignedTickets = data.filter(t => t.assigned_to === null)
        const activeUnassignedTickets = unassignedTickets.filter(t => t.status !== 'closed' && t.status !== 'resolved')

        const newCounts: TicketCounts = {
          total: activeTeamTickets.length,
          new: activeTeamTickets.filter(t => t.status === 'new').length,
          open: activeTeamTickets.filter(t => t.status === 'open').length,
          pending: activeTeamTickets.filter(t => t.status === 'pending').length,
          resolved: teamTickets.filter(t => t.status === 'resolved').length,
          recently_closed: teamTickets.filter(t => 
            t.status === 'closed' && 
            new Date(t.updated_at) >= sevenDaysAgo
          ).length,
          urgent: activeTeamTickets.filter(t => t.priority === 'urgent').length,
          high: activeTeamTickets.filter(t => t.priority === 'high').length,
          assigned: activeTeamTickets.filter(t => t.assigned_to !== null).length,
          unassigned: activeUnassignedTickets.length
        }
        setCounts(newCounts)
      }
    } catch (e) {
      console.error('Error loading counts:', e)
      setError('failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
        loading dashboard...
      </div>
    </div>
  )
  if (error) return <div className="text-red-600">failed to {error}</div>

  if (profile?.role === 'manager') {
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

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">ticket status</h2>
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
        </div>
      </div>
    )
  }

  if (profile?.role === 'worker') {
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

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">my active tickets</h2>
            <div className="space-y-2">
              <Link to={`/tickets?assigned=me&status=active`} className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">assigned to me</span>
                <span className="text-primary">{counts.assigned}</span>
              </Link>
              <Link to={`/tickets?priority=urgent&assigned=me&status=active`} className="flex justify-between px-2 py-1 rounded-md hover:bg-red-500/5">
                <span className="text-red-500">urgent</span>
                <span className="text-red-500">{counts.urgent}</span>
              </Link>
              <Link to={`/tickets?priority=high&assigned=me&status=active`} className="flex justify-between px-2 py-1 rounded-md hover:bg-orange-500/5">
                <span className="text-orange-500">high</span>
                <span className="text-orange-500">{counts.high}</span>
              </Link>
            </div>
          </div>

          <div className="bg-background border border-primary shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-primary mb-4">available tickets</h2>
            <div className="space-y-2">
              <Link to="/tickets?assigned=unassigned&status=active" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">unassigned</span>
                <span className="text-primary">{counts.unassigned}</span>
              </Link>
              <Link to="/tickets?status=new&assigned=unassigned" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
                <span className="text-primary">new</span>
                <span className="text-primary">{counts.new}</span>
              </Link>
            </div>
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
            <Link to="/tickets?status=active" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
              <span className="text-primary">open tickets</span>
              <span className="text-primary">{counts.new + counts.open + counts.pending}</span>
            </Link>
            <Link to="/tickets?status=resolved" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
              <span className="text-primary">resolved</span>
              <span className="text-primary">{counts.resolved}</span>
            </Link>
            <Link to="/tickets?status=closed&closed_after=7d" className="flex justify-between px-2 py-1 rounded-md hover:bg-primary/5">
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