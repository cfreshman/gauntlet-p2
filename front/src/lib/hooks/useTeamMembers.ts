import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useUsernames } from './useUsernames'

interface Worker {
  id: string
  username: string
  email?: string
  role: string
  team_members: { team_id: string }[]
}

interface TeamMember {
  team_id: string
  name?: string
}

export function useTeamMembers(userId?: string) {
  const { fetchUsername } = useUsernames()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      loadWorkers()

      const channel = supabase
        .channel('workers')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: 'role=eq.worker'
          },
          () => {
            loadWorkers()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [userId])

  // Load usernames when workers change
  useEffect(() => {
    workers.forEach(worker => {
      fetchUsername(worker.id)
    })
  }, [workers])

  async function loadWorkers() {
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

      if (tm) {
        // Get team name
        const { data: team, error: teamNameError } = await supabase
          .from('teams')
          .select('name')
          .eq('id', tm.team_id)
          .single()

        if (teamNameError) {
          console.error('Error loading team name:', teamNameError)
          setError('failed to load team name')
          return
        }

        setTeamMember({ ...tm, name: team.name })

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

        console.log('Found team memberships:', teamMemberships)
        const memberIds = teamMemberships.map(m => m.user_id)
        console.log('Member IDs to query:', memberIds)

        if (!teamMemberships.length) {
          setWorkers([])
          return
        }

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

        console.log('Found profiles:', profiles)

        // Format workers with team info
        const workersWithTeams = profiles.map(profile => ({
          ...profile,
          team_members: [{ team_id: tm.team_id }]
        }))

        setWorkers(workersWithTeams)
      } else {
        setTeamMember(null)
      }

      setLoading(false)
      setError(null)
    } catch (error) {
      console.error('Error:', error)
      setError('failed to load workers')
      setLoading(false)
    }
  }

  async function assignWorker(workerId: string) {
    if (!teamMember?.team_id) return

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamMember.team_id,
          user_id: workerId
        })

      if (error) throw error
      await loadWorkers()
    } catch (error) {
      console.error('Error assigning worker:', error)
      setError('failed to assign worker')
    }
  }

  async function unassignWorker(workerId: string) {
    if (!teamMember?.team_id) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', workerId)
        .eq('team_id', teamMember.team_id)

      if (error) throw error
      await loadWorkers()
    } catch (error) {
      console.error('Error unassigning worker:', error)
      setError('failed to unassign worker')
    }
  }

  return {
    workers,
    teamMember,
    loading,
    error,
    assignWorker,
    unassignWorker,
    loadWorkers
  }
} 