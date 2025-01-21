import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useUsernames } from './useUsernames'

interface TeamMember {
  id: string
  username: string
  role: 'worker' | 'manager'
}

export function useTeammates(userId?: string) {
  const { fetchUsername } = useUsernames()
  const [teammates, setTeammates] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadTeammates()

      const channel = supabase
        .channel('teammates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_members'
          },
          () => {
            loadTeammates()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [userId])

  // Load usernames when teammates change
  useEffect(() => {
    teammates.forEach(member => {
      fetchUsername(member.id)
    })
  }, [teammates])

  async function loadTeammates() {
    if (!userId) return

    try {
      // Get user's team first
      const { data: tm, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (teamError) {
        console.error('Error loading team:', teamError)
        setError('failed to load team')
        return
      }

      if (!tm) {
        setTeammates([])
        setLoading(false)
        return
      }

      // Get team members first
      const { data: teamMemberships, error: membershipError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', tm.team_id)

      if (membershipError) {
        console.error('Error loading team memberships:', membershipError)
        setError('failed to load team memberships')
        return
      }

      if (!teamMemberships.length) {
        setTeammates([])
        setLoading(false)
        return
      }

      const memberIds = teamMemberships.map(m => m.user_id)

      // Get profiles for team members
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, role')
        .in('id', memberIds)

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        setError('failed to load profiles')
        return
      }

      setTeammates(profiles)
      setLoading(false)
      setError(null)
    } catch (error) {
      console.error('Error:', error)
      setError('failed to load team members')
      setLoading(false)
    }
  }

  function getAssignableMembers(userRole: string) {
    if (userRole === 'manager') {
      // Managers can assign to themselves or any worker
      return [
        ...teammates.filter(member => member.id === userId), // Self
        ...teammates.filter(member => member.role === 'worker')
      ]
    } else if (userRole === 'worker') {
      // Workers can assign to themselves or their manager
      const manager = teammates.find(member => member.role === 'manager')
      return [
        ...teammates.filter(member => member.id === userId), // Self
        ...(manager ? [manager] : []) // Manager if exists
      ]
    }
    return []
  }

  return {
    teammates,
    loading,
    error,
    getAssignableMembers
  }
} 