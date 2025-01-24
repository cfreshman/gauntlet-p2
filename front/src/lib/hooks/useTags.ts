import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export interface Tag {
  id: string
  name: string
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTags()

    // Subscribe to changes
    const channel = supabase
      .channel('tags')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_tags' },
        () => loadTags()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function loadTags() {
    try {
      const { data, error } = await supabase
        .from('ticket_tags')
        .select('*')
        .order('name')

      if (error) throw error
      setTags(data)
    } catch (e) {
      console.error('Error loading tags:', e)
      setError('failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  async function createTag(name: string) {
    try {
      const { data, error } = await supabase
        .from('ticket_tags')
        .insert({ name })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (e) {
      console.error('Error creating tag:', e)
      setError('failed to create tag')
      return null
    }
  }

  return {
    tags,
    loading,
    error,
    createTag
  }
} 