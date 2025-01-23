import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import type { Profile } from '../../lib/hooks/useAuth'

export function UnclaimedManagers() {
  const { profile } = useAuth()
  const [managers, setManagers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role === 'manager') {
      loadTeamAndManagers()

      // Subscribe to team_members changes
      const channel = supabase
        .channel('unclaimed-managers')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_members'
          },
          () => {
            loadTeamAndManagers()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: 'role=eq.manager'
          },
          () => {
            loadTeamAndManagers()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [profile])

  async function loadTeamAndManagers() {
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

      // Get all managers
      const { data: allManagers, error: managersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'manager')

      if (managersError) throw managersError

      // Get all team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')

      if (membersError) throw membersError

      // Filter out managers who are already on teams
      const teamMemberIds = new Set(teamMembers.map(tm => tm.user_id))
      const unclaimedManagers = allManagers.filter(manager => 
        !teamMemberIds.has(manager.id) && manager.id !== profile?.id
      )

      setManagers(unclaimedManagers)
    } catch (error) {
      console.error('Error loading managers:', error)
      setError('failed to load managers')
    } finally {
      setLoading(false)
    }
  }

  async function assignManager(managerId: string) {
    if (!teamId) return

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: managerId
        })

      if (error) throw error
      loadTeamAndManagers()
    } catch (error) {
      console.error('Error assigning manager:', error)
      setError('failed to assign manager')
    }
  }

  if (!profile || profile.role !== 'manager') return null
  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading managers...
    </div>
  )
  if (!teamId) return null
  if (managers.length === 0) return null

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <h3 className="text-lg font-medium">floating managers</h3>
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        <div className="space-y-2">
          {managers.map(manager => (
            <div key={manager.id} className="flex items-center justify-between">
              <span className="text-sm">{manager.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => assignManager(manager.id)}
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