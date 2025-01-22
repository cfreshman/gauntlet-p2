import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

interface Team {
  id: string
  name: string
  created_at: string
  created_by: string
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTeams()

    // Subscribe to changes
    const channel = supabase
      .channel('teams')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams'
        },
        () => {
          loadTeams()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name')

      if (error) throw error
      setTeams(data || [])
    } catch (e) {
      console.error('Error loading teams:', e)
      setError('failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  return { teams, loading, error }
} 