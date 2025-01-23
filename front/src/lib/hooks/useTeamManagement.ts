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

  return {
    members,
    team,
    loading,
    error,
    assignWorker,
    unassignWorker
  }
} 