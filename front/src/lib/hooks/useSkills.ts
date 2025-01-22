import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

interface Skill {
  id: string
  name: string
  created_at: string
}

export function useSkills(userId?: string) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [userSkills, setUserSkills] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSkills()

    // Subscribe to skills changes
    const skillsSubscription = supabase
      .channel('skills_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'skills' },
        () => loadSkills()
      )
      .subscribe()

    return () => {
      skillsSubscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadUserSkills()

      // Subscribe to user_skills changes
      const userSkillsSubscription = supabase
        .channel('user_skills_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'user_skills', filter: `user_id=eq.${userId}` },
          () => loadUserSkills()
        )
        .subscribe()

      return () => {
        userSkillsSubscription.unsubscribe()
      }
    }
  }, [userId])

  async function loadSkills() {
    try {
      const { data, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('name')

      if (skillsError) throw skillsError

      setSkills(data || [])
    } catch (err) {
      console.error('Error loading skills:', err)
      setError('failed to load skills')
    } finally {
      setLoading(false)
    }
  }

  async function loadUserSkills() {
    if (!userId) return

    try {
      const { data, error: userSkillsError } = await supabase
        .from('user_skills')
        .select('skill_id')
        .eq('user_id', userId)

      if (userSkillsError) throw userSkillsError

      setUserSkills(new Set(data?.map(us => us.skill_id)))
    } catch (err) {
      console.error('Error loading user skills:', err)
      setError('failed to load user skills')
    }
  }

  return {
    skills,
    userSkills,
    loading,
    error,
    refresh: loadSkills
  }
} 