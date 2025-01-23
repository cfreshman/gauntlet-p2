import { useTeam } from './useTeam'
import { supabase } from '../supabase'

export function useTeamManagement(userId?: string) {
  const { members, team, loading, error, loadTeamData } = useTeam(userId)

  async function assignWorker(workerId: string) {
    if (!team?.id) return

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: workerId
        })

      if (error) throw error
      await loadTeamData()
    } catch (error) {
      console.error('Error assigning worker:', error)
      throw new Error('failed to assign worker')
    }
  }

  async function unassignWorker(workerId: string) {
    if (!team?.id) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', workerId)
        .eq('team_id', team.id)

      if (error) throw error
      await loadTeamData()
    } catch (error) {
      console.error('Error unassigning worker:', error)
      throw new Error('failed to unassign worker')
    }
  }

  async function promoteToManager(workerId: string) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ id: workerId, role: 'manager' })
        }
      )

      const data = await response.json()
      if (data.error) throw data.error
    } catch (error) {
      console.error('Error promoting to manager:', error)
      throw new Error('failed to promote worker to manager')
    }
  }

  async function leaveTeam() {
    if (!team?.id || !userId) return

    try {
      // Check if there are other managers in the team
      const otherManagers = members.filter(m => m.role === 'manager' && m.id !== userId)
      
      if (otherManagers.length === 0) {
        throw new Error('promote another team member to manager before leaving')
      }

      // Safe to leave since there's another manager
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', userId)
        .eq('team_id', team.id)

      if (error) throw error
      await loadTeamData()
    } catch (error) {
      console.error('Error leaving team:', error)
      throw error instanceof Error ? error : new Error('failed to leave team')
    }
  }

  return {
    members,
    team,
    loading,
    error,
    assignWorker,
    unassignWorker,
    leaveTeam,
    promoteToManager
  }
} 