import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import type { Profile } from '../../lib/hooks/useAuth'

export function UnclaimedWorkers() {
  const { profile } = useAuth()
  const [workers, setWorkers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role === 'manager') {
      loadTeamAndWorkers()

      // Subscribe to team_members changes
      const channel = supabase
        .channel('unclaimed-workers')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_members'
          },
          () => {
            loadTeamAndWorkers()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: 'role=eq.worker'
          },
          () => {
            loadTeamAndWorkers()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [profile])

  async function loadTeamAndWorkers() {
    try {
      // Get manager's team first
      const { data: tm, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile?.id)
        .maybeSingle()

      if (teamError) throw teamError
      if (!tm) return // No team yet

      setTeamId(tm.team_id)
      console.log('Found team:', tm.team_id)

      // Get all workers
      const { data: allWorkers, error: workersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')

      if (workersError) throw workersError
      console.log('Found workers:', allWorkers)

      // Get all team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')

      if (membersError) throw membersError
      console.log('Found team members:', teamMembers)

      // Filter out workers who are already on teams
      const teamMemberIds = new Set(teamMembers.map(tm => tm.user_id))
      const unclaimedWorkers = allWorkers.filter(worker => !teamMemberIds.has(worker.id))
      console.log('Unclaimed workers:', unclaimedWorkers)

      setWorkers(unclaimedWorkers)
    } catch (error) {
      console.error('Error loading workers:', error)
      setError('failed to load workers')
    } finally {
      setLoading(false)
    }
  }

  async function assignWorker(workerId: string) {
    if (!teamId) return

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: workerId
        })

      if (error) throw error
      loadTeamAndWorkers()
    } catch (error) {
      console.error('Error assigning worker:', error)
      setError('failed to assign worker')
    }
  }

  if (!profile || profile.role !== 'manager') return null
  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading workers...
    </div>
  )
  if (!teamId) return null
  if (workers.length === 0) return null

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <h3 className="text-lg font-medium">unclaimed workers</h3>
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        <div className="space-y-2">
          {workers.map(worker => (
            <div key={worker.id} className="flex items-center justify-between">
              <span className="text-sm">{worker.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => assignWorker(worker.id)}
              >
                add to team
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 