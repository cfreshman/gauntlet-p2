import { useTeam, TeamMember } from './useTeam'

export function useTeamAssignment(userId?: string) {
  const { members, team, loading, error } = useTeam(userId)

  function getAssignableMembers(userRole: string): TeamMember[] {
    if (!userId || !members.length) return []

    if (userRole === 'manager') {
      // Managers can assign to themselves or any worker
      return [
        ...members.filter(member => member.id === userId), // Self
        ...members.filter(member => member.role === 'worker')
      ]
    } else if (userRole === 'worker') {
      // Workers can assign to themselves or their manager
      const manager = members.find(member => member.role === 'manager')
      return [
        ...members.filter(member => member.id === userId), // Self
        ...(manager ? [manager] : []) // Manager if exists
      ]
    }
    return []
  }

  return {
    members,
    team,
    loading,
    error,
    getAssignableMembers
  }
} 