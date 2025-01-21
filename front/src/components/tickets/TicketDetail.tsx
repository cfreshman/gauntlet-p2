import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ticket, TicketStatus, TicketPriority } from '../../lib/types'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { useTeammates } from '../../lib/hooks/useTeammates'
import { useCustomFields } from '../../lib/hooks/useCustomFields'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { CustomFields } from './CustomFields'
import { CustomField } from './CustomField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { createDebouncer } from '../../lib/utils'

interface Comment {
  id: string
  content: string
  created_at: string
  created_by: string
  internal: boolean
}

interface TicketWithProfile extends Ticket {
  assigned_to: string | null
  created_by: string
  team_id: string
  profiles: {
    username: string
  }
}

export function TicketDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const { usernames, fetchUsername } = useUsernames()
  const [ticket, setTicket] = useState<TicketWithProfile | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingComment, setUpdatingComment] = useState(false)
  const [updatingTicket, setUpdatingTicket] = useState(false)
  const { getAssignableMembers } = useTeammates(profile?.id)
  const { fields, values, updateValue } = useCustomFields(id)
  const { fields: allFields } = useFieldDefinitions()
  const [addingField, setAddingField] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState('')
  const saveDebouncer = createDebouncer()

  useEffect(() => {
    loadTicket()
    loadComments()

    const channel = supabase
      .channel('ticket')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Ticket changed:', payload)
          loadTicket()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${id}`
        },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [id])

  // Load usernames when ticket/comments change
  useEffect(() => {
    if (ticket) {
      fetchUsername(ticket.created_by)
      if (ticket.assigned_to) {
        fetchUsername(ticket.assigned_to)
      }
    }

    comments.forEach(comment => {
      fetchUsername(comment.created_by)
    })
  }, [ticket, comments])

  async function loadTicket() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTicket(data)
      setLoading(false)
    } catch (e) {
      console.error('Error loading ticket:', e)
      setError('failed to load ticket')
      setLoading(false)
    }
  }

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data)
    } catch (e) {
      console.error('Error loading comments:', e)
      setError('failed to load comments')
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticket.id)
        .select()
        .single()

      if (error) throw error
      setTicket(prev => prev ? { ...prev, status } : null)
    } catch (e) {
      console.error('Error updating status:', e)
      setError('failed to update status')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handlePriorityChange(priority: TicketPriority) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          priority
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, priority } : null)
    } catch (e) {
      console.error('Error updating priority:', e)
      setError('failed to update priority')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleAssignmentChange(userId: string | null) {
    if (!user || !ticket) return
    setUpdatingTicket(true)
    
    try {
      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          assigned_to: userId
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, assigned_to: userId } : null)
    } catch (e) {
      console.error('Error updating assignment:', e)
      setError('failed to update assignment')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !ticket || !newComment.trim()) return
    setUpdatingComment(true)

    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          content: newComment.trim(),
          internal: false,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      setNewComment('')
      await loadComments()
    } catch (e) {
      console.error('Error creating comment:', e)
      setError('failed to create comment')
    } finally {
      setUpdatingComment(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleCommentSubmit(e)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!user || !ticket) return
    setUpdatingComment(true)

    try {
      const { error } = await supabase
        .from('ticket_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      await loadComments()
    } catch (e) {
      console.error('Error deleting comment:', e)
      setError('failed to delete comment')
    } finally {
      setUpdatingComment(false)
    }
  }

  async function handleShareTemplate() {
    if (!ticket) return
    const url = `${window.location.origin}/tickets/new?template=${ticket.id}`
    await navigator.clipboard.writeText(url)
    alert('template URL copied to clipboard')
  }

  async function handleFieldValueChange(fieldId: string, value: string) {
    if (!user || !ticket) return
    
    // Update UI immediately
    updateValue(fieldId, value)
    
    // Debounce the save operation
    saveDebouncer.debounce(`field-${fieldId}`, async () => {
      setUpdatingTicket(true)
      
      try {
        const { data, error } = await supabase
          .from('ticket_field_values')
          .upsert({
            ticket_id: ticket.id,
            field_id: fieldId,
            value
          })
          .select()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
      } catch (e) {
        console.error('Error updating field value:', e)
        setError('failed to update field value')
        // Reload fields to reset UI state
        loadTicket()
      } finally {
        setUpdatingTicket(false)
      }
    })
  }

  // Clean up debouncer on unmount
  useEffect(() => {
    return () => {
      saveDebouncer.clearAll()
    }
  }, [])

  if (loading) return <div>loading ticket...</div>
  if (!ticket) return <div>ticket not found</div>

  const isAssignedToMe = ticket.assigned_to === user?.id
  const canUpdateStatus = profile?.role === 'manager' || isAssignedToMe
  const assignableMembers = profile ? getAssignableMembers(profile.role) : []
  const isTemplate = ticket.title.startsWith('template: ')
  const isManager = profile?.role === 'manager'
  const isManagerOrWorker = profile?.role === 'manager' || profile?.role === 'worker'

  async function handleTemplateToggle() {
    if (!ticket) return
    setUpdatingTicket(true)
    
    try {
      const newTitle = isTemplate
        ? ticket.title.slice(9) // Remove prefix
        : `template: ${ticket.title}` // Add prefix

      const { error } = await supabase.functions.invoke('update-ticket', {
        body: {
          id: ticket.id,
          title: newTitle
        }
      })

      if (error) throw error
      setTicket(prev => prev ? { ...prev, title: newTitle } : null)
    } catch (e) {
      console.error('Error updating template status:', e)
      setError('failed to update template status')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleAddField() {
    if (!selectedFieldId) return
    
    const { error } = await supabase
      .from('ticket_field_values')
      .insert({
        ticket_id: id,
        field_id: selectedFieldId,
        value: ''
      })

    if (error) {
      console.error('Error adding field:', error)
      return
    }

    setAddingField(false)
    setSelectedFieldId('')
    // Reload fields
    loadTicket()
  }

  async function handleRemoveField(fieldId: string) {
    const { error } = await supabase
      .from('ticket_field_values')
      .delete()
      .eq('ticket_id', id)
      .eq('field_id', fieldId)

    if (error) {
      console.error('Error removing field:', error)
      return
    }

    // Reload fields
    loadTicket()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {isTemplate ? ticket.title.slice(9) : ticket.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            created by {usernames[ticket.created_by] || 'unknown'}
          </p>
        </div>
        <div className="flex gap-2">
          {profile?.role !== 'customer' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTemplate}
              disabled={!isTemplate}
            >
              share as template
            </Button>
          )}
          {(profile?.role === 'manager' || ticket.created_by === user?.id) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTemplateToggle}
              disabled={updatingTicket}
            >
              {isTemplate ? 'unmark as template' : 'mark as template'}
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">status</span>
            {canUpdateStatus ? (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={updatingTicket}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="new">new</option>
                <option value="open">open</option>
                <option value="pending">pending</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </select>
            ) : (
              <p className="font-medium">{ticket.status}</p>
            )}
          </div>
          <div>
            <span className="text-sm text-gray-500">priority</span>
            {profile?.role === 'manager' || ticket.created_by === user?.id ? (
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                disabled={updatingTicket}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            ) : (
              <p className="font-medium">{ticket.priority}</p>
            )}
          </div>
          <div>
            <span className="text-sm text-gray-500">assignee</span>
            {profile?.role === 'manager' || (profile?.role === 'worker' && (!ticket.assigned_to || ticket.assigned_to === user?.id)) ? (
              <select
                value={ticket.assigned_to || ''}
                onChange={(e) => handleAssignmentChange(e.target.value || null)}
                disabled={updatingTicket}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">unassigned</option>
                {assignableMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {usernames[member.id] || member.username} ({member.role})
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-medium">
                {ticket.assigned_to ? usernames[ticket.assigned_to] || 'unknown' : 'unassigned'}
              </p>
            )}
          </div>
        </div>

        {ticket.description && (
          <div className="mt-6">
            <span className="text-sm text-gray-500">description</span>
            <p className="mt-1 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        {isManager && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">custom fields</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAddingField(true)}
              >
                add field
              </Button>
            </div>

            {addingField && (
              <div className="mt-2 flex gap-2">
                <Select
                  value={selectedFieldId}
                  onValueChange={setSelectedFieldId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {allFields
                      .filter(f => !fields.find(existing => existing.id === f.id))
                      .map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleAddField}>add</Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setAddingField(false)
                  setSelectedFieldId('')
                }}>
                  cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {fields.length > 0 && (
          <div className="mt-4">
            {fields.map(field => (
              <div key={field.id} className="flex items-center gap-2">
                <CustomField
                  field={field}
                  value={values[field.id] || ''}
                  onChange={(value: string) => handleFieldValueChange(field.id, value)}
                  readOnly={!isManagerOrWorker}
                />
                {isManager && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(field.id)}
                  >
                    remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">comments</h2>
        
        <div className="space-y-4 mb-4">
          {comments.map(comment => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{usernames[comment.created_by] || 'unknown'}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                {(profile?.role === 'manager' || (profile?.role === 'customer' && comment.created_by === user?.id)) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={updatingComment}
                  >
                    delete
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleCommentSubmit}>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            rows={3}
            disabled={updatingComment}
          />
          <Button type="submit" disabled={updatingComment || !newComment.trim()}>
            {updatingComment ? 'posting...' : 'post comment'}
          </Button>
        </form>
      </div>
    </div>
  )
} 