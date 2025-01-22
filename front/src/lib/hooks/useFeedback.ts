import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useUsernames } from './useUsernames'
import { supabase } from '../supabase'

interface TicketFeedback {
  rating: number
  tickets: {
    assigned_to: string
    team_id?: string
  }
}

interface TeamMember {
  user_id: string
}

export interface FeedbackStats {
  // Distribution of ratings (1-5)
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  // Average rating
  average: number
  // Total number of ratings
  total: number
}

export interface FeedbackStatsWithUser extends FeedbackStats {
  user_id: string
  user_name: string
}

export function useFeedback() {
  const { profile } = useAuth()
  const { fetchUsername } = useUsernames()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [personalStats, setPersonalStats] = useState<FeedbackStats>({
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    average: 0,
    total: 0
  })
  const [teamStats, setTeamStats] = useState<FeedbackStats>({
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    average: 0,
    total: 0
  })
  const [teamMemberStats, setTeamMemberStats] = useState<FeedbackStatsWithUser[]>([])

  useEffect(() => {
    loadFeedbackStats()
  }, [profile?.id])

  async function loadFeedbackStats() {
    try {
      setLoading(true)
      
      // Get user's team first
      const { data: teamData } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile?.id)
        .single()

      // Get all feedback for tickets assigned to the user
      const { data: personalFeedback } = await supabase
        .from('ticket_feedback')
        .select(`
          rating,
          tickets!inner (
            assigned_to
          )
        `)
        .eq('tickets.assigned_to', profile?.id) as { data: TicketFeedback[] | null }

      // Calculate personal stats
      if (personalFeedback) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        let sum = 0
        personalFeedback.forEach(f => {
          distribution[f.rating as 1|2|3|4|5]++
          sum += f.rating
        })
        setPersonalStats({
          distribution,
          average: personalFeedback.length ? sum / personalFeedback.length : 0,
          total: personalFeedback.length
        })
      }

      // For managers, get team-wide stats
      if (profile?.role === 'manager' && teamData?.team_id) {
        // Get all feedback for tickets assigned to team members
        const { data: teamFeedback } = await supabase
          .from('ticket_feedback')
          .select(`
            rating,
            tickets!inner (
              assigned_to,
              team_id
            )
          `)
          .eq('tickets.team_id', teamData.team_id) as { data: TicketFeedback[] | null }

        if (teamFeedback) {
          // Calculate team stats
          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          let sum = 0
          teamFeedback.forEach(f => {
            distribution[f.rating as 1|2|3|4|5]++
            sum += f.rating
          })
          setTeamStats({
            distribution,
            average: teamFeedback.length ? sum / teamFeedback.length : 0,
            total: teamFeedback.length
          })

          // Get team members
          const { data: teamMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamData.team_id) as { data: TeamMember[] | null }

          if (teamMembers) {
            const memberStats = await Promise.all(
              teamMembers.map(async member => {
                const memberFeedback = teamFeedback.filter(
                  f => f.tickets.assigned_to === member.user_id
                )
                const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                let sum = 0
                memberFeedback.forEach(f => {
                  distribution[f.rating as 1|2|3|4|5]++
                  sum += f.rating
                })
                const username = await fetchUsername(member.user_id)
                return {
                  user_id: member.user_id,
                  user_name: username || 'unknown',
                  distribution,
                  average: memberFeedback.length ? sum / memberFeedback.length : 0,
                  total: memberFeedback.length
                }
              })
            )
            setTeamMemberStats(memberStats.sort((a, b) => b.average - a.average))
          }
        }
      }
    } catch (e) {
      console.error('Error loading feedback stats:', e)
      setError('Failed to load feedback stats')
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    personalStats,
    teamStats,
    teamMemberStats,
    refresh: loadFeedbackStats
  }
} 