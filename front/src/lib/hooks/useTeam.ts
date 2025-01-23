import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useUsernames } from './useUsernames'

export interface TeamMember {
  id: string
  username: string
  role: 'worker' | 'manager'
}

export interface Team {
  id: string
  name: string
}

export function useTeam(userId?: string) {
  const { fetchUsername } = useUsernames()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadTeamData()

      const channel = supabase
        .channel('team-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_members'
          },
          () => {
            loadTeamData()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [userId])

  // Load usernames when members change
  useEffect(() => {
    members.forEach(member => {
      fetchUsername(member.id)
    })
  }, [members])

  async function loadTeamData() {
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
        setMembers([])
        setTeam(null)
        setLoading(false)
        return
      }

      // Get team details
      const { data: teamData, error: teamDetailsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', tm.team_id)
        .single()

      if (teamDetailsError) {
        console.error('Error loading team details:', teamDetailsError)
        setError('failed to load team details')
        return
      }

      setTeam(teamData)

      // Get team members
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
        setMembers([])
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

      setMembers(profiles)
      setLoading(false)
      setError(null)
    } catch (error) {
      console.error('Error:', error)
      setError('failed to load team data')
      setLoading(false)
    }
  }

  return {
    members,
    team,
    loading,
    error,
    loadTeamData
  }
} 