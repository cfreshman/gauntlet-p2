import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

interface Tag {
  id: string
  name: string
}

interface TagLink {
  ticket_tags: Tag
}

export function useTicketTags(ticketId?: string) {
  const [ticketTags, setTicketTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ticketId) {
      loadTicketTags()

      // Subscribe to changes
      const channel = supabase
        .channel('ticket-tags')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ticket_tag_links', filter: `ticket_id=eq.${ticketId}` },
          () => loadTicketTags()
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [ticketId])

  async function loadTicketTags() {
    if (!ticketId) return

    try {
      const { data, error } = await supabase
        .from('ticket_tag_links')
        .select('ticket_tags(id, name)')
        .eq('ticket_id', ticketId)

      if (error) throw error
      const links = data as unknown as TagLink[]
      setTicketTags(links.map(link => link.ticket_tags))
    } catch (e) {
      console.error('Error loading ticket tags:', e)
      setError('failed to load ticket tags')
    } finally {
      setLoading(false)
    }
  }

  async function addTag(tagId: string) {
    if (!ticketId) return

    try {
      const { error } = await supabase
        .from('ticket_tag_links')
        .insert({ ticket_id: ticketId, tag_id: tagId })

      if (error) throw error
      await loadTicketTags() // Reload tags to update UI immediately
    } catch (e) {
      console.error('Error adding tag:', e)
      setError('failed to add tag')
    }
  }

  async function removeTag(tagId: string) {
    if (!ticketId) {
      console.error('Cannot remove tag: no ticketId provided')
      return
    }

    try {
      console.log('Removing tag:', { ticketId, tagId })
      const { error } = await supabase
        .from('ticket_tag_links')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('tag_id', tagId)

      if (error) {
        console.error('Supabase error removing tag:', error)
        throw error
      }
      
      console.log('Successfully removed tag')
      await loadTicketTags() // Reload tags to update UI
    } catch (e) {
      console.error('Error removing tag:', e)
      setError('failed to remove tag')
      throw e
    }
  }

  return {
    ticketTags,
    loading,
    error,
    addTag,
    removeTag
  }
} 