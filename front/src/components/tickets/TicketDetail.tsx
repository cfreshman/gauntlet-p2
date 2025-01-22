import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ticket, TicketStatus, TicketPriority } from '../../lib/types'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { useTeammates } from '../../lib/hooks/useTeammates'
import { useCustomFields } from '../../lib/hooks/useCustomFields'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { CustomField } from './CustomField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { createDebouncer } from '../../lib/utils'
import { useTags } from '../../lib/hooks/useTags'
import { useTicketTags } from '../../lib/hooks/useTicketTags'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ChevronsUpDown, TrashIcon, Star } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'

interface Comment {
  id: string
  content: string
  created_at: string
  created_by: string
  internal: boolean
}

interface TicketFeedback {
  id: string
  rating: number
  comment: string | null
  created_at: string
  created_by: string
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
  const [feedback, setFeedback] = useState<TicketFeedback | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingTicket, setUpdatingTicket] = useState(false)
  const { getAssignableMembers } = useTeammates(profile?.id)
  const { fields, values, updateValue, loadFields } = useCustomFields(id)
  const { fields: allFields } = useFieldDefinitions()
  const [addingField, setAddingField] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState('')
  const saveDebouncer = createDebouncer()
  const { tags, createTag } = useTags()
  const { ticketTags, addTag, removeTag } = useTicketTags(id)
  const [tagSearchOpen, setTagSearchOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [newFeedback, setNewFeedback] = useState({
    rating: 5,
    comment: ''
  })

  const isTemplate = ticket?.title.startsWith('template: ')
  const isManager = profile?.role === 'manager'
  const isManagerOrWorker = profile?.role === 'manager' || profile?.role === 'worker'
  const canLeaveFeedback = profile?.role === 'customer' && 
    ticket?.created_by === user?.id && 
    (ticket?.status === 'resolved' || ticket?.status === 'closed')

  // Add state to track if we're editing
  const [isEditing, setIsEditing] = useState(false)

  const filteredTags = useMemo(() => {
    const searchLower = tagSearch.toLowerCase()
    const filtered = tags
      .filter(t => !ticketTags.find(tt => tt.id === t.id))
      .filter(t => t.name.toLowerCase().includes(searchLower))

    if (isManager && tagSearch && !tags.find(t => t.name.toLowerCase() === tagSearch.toLowerCase())) {
      filtered.push({ id: 'create', name: `create "${tagSearch}"` })
    }

    return filtered
  }, [tags, ticketTags, tagSearch, isManager])

  useEffect(() => {
    loadTicket()
    loadComments()
    loadFeedback()

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_feedback',
          filter: `ticket_id=eq.${id}`
        },
        () => {
          loadFeedback()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [id])

  // Load usernames when ticket/comments/feedback change
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

    if (feedback) {
      fetchUsername(feedback.created_by)
    }
  }, [ticket, comments, feedback])

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

  async function loadFeedback() {
    try {
      const { data, error } = await supabase
        .from('ticket_feedback')
        .select('*')
        .eq('ticket_id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
      setFeedback(data)
      
      // Pre-fetch username for feedback
      if (data) {
        await fetchUsername(data.created_by)
      }
    } catch (e) {
      console.error('Error loading feedback:', e)
      setError('failed to load feedback')
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

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !ticket || !newComment.trim()) return
    setUpdatingTicket(true)

    try {
      const { error } = await supabase.functions.invoke('create-comment', {
        body: {
          ticket_id: ticket.id,
          content: newComment.trim(),
          internal: isInternal,
        },
      })

      if (error) throw error
      setNewComment('')
      setIsInternal(false)
    } catch (e) {
      console.error('Error creating comment:', e)
      setError('failed to create comment')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!user || !ticket) return
    setUpdatingTicket(true)

    try {
      const { error } = await supabase
        .from('ticket_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
    } catch (e) {
      console.error('Error deleting comment:', e)
      setError('failed to delete comment')
    } finally {
      setUpdatingTicket(false)
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
        const { error } = await supabase
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

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
        loading ticket...
      </div>
    </div>
  )
  if (!ticket) return <div>ticket not found</div>

  const isAssignedToMe = ticket.assigned_to === user?.id
  const canUpdateStatus = profile?.role === 'manager' || isAssignedToMe
  const assignableMembers = profile ? getAssignableMembers(profile.role) : []

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
    // Reload fields and ticket data
    await Promise.all([
      loadTicket(),
      loadFields()
    ])
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

    // Reload fields and ticket data
    await Promise.all([
      loadTicket(),
      loadFields()
    ])
  }

  // Add function to start editing feedback
  function handleEditFeedback() {
    if (!feedback) return
    setNewFeedback({
      rating: feedback.rating,
      comment: feedback.comment || ''
    })
    setIsEditing(true)
  }

  // Add function to cancel editing
  function handleCancelEdit() {
    setIsEditing(false)
    setNewFeedback({ rating: 5, comment: '' })
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !ticket) return
    setUpdatingTicket(true)

    try {
      if (isEditing) {
        // Update existing feedback
        const { error } = await supabase
          .from('ticket_feedback')
          .update({
            rating: newFeedback.rating,
            comment: newFeedback.comment.trim() || null
          })
          .eq('id', feedback?.id)

        if (error) throw error
      } else {
        // Create new feedback
        const { data, error } = await supabase
          .from('ticket_feedback')
          .insert({
            ticket_id: ticket.id,
            rating: newFeedback.rating,
            comment: newFeedback.comment.trim() || null
          })
          .select()
          .single()

        if (error) throw error
        
        // Pre-fetch username for new feedback
        if (data) {
          await fetchUsername(data.created_by)
        }
      }

      await loadFeedback()
      setNewFeedback({ rating: 5, comment: '' })
      setIsEditing(false)
    } catch (e) {
      console.error('Error submitting feedback:', e)
      setError('failed to submit feedback')
    } finally {
      setUpdatingTicket(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="space-y-4">
        {/* Feedback Display */}
        {feedback && !isEditing && (
          <div className="bg-background border border-primary shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-primary">feedback</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < feedback.rating ? 'fill-yellow-500 text-yellow-500' : 'fill-primary/10 text-primary/10'}`}
                    />
                  ))}
                </div>
                {(profile?.role === 'manager' || feedback.created_by === user?.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditFeedback}
                  >
                    edit
                  </Button>
                )}
              </div>
            </div>
            {feedback.comment && feedback.comment.trim() && (
              <div className="text-primary whitespace-pre-wrap mt-4">
                {feedback.comment}
              </div>
            )}
          </div>
        )}

        {/* Feedback Form */}
        {((canLeaveFeedback && !feedback) || isEditing) && (
          <div className="bg-background border border-primary shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {isEditing ? 'edit feedback' : 'leave feedback'}
            </h2>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <span className="text-sm text-primary/70">rating</span>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewFeedback({ ...newFeedback, rating: i + 1 })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${i < newFeedback.rating ? 'fill-yellow-500 text-yellow-500' : 'fill-primary/10 text-primary/10'} hover:fill-yellow-500 hover:text-yellow-500 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-primary/70">comment (optional)</span>
                <Textarea 
                  value={newFeedback.comment}
                  onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                  placeholder="write your comment..."
                  className="w-full mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!newFeedback.rating || updatingTicket}>
                  {updatingTicket ? 'submitting...' : isEditing ? 'update feedback' : 'submit feedback'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                    cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Main Ticket Details */}
        <div className="bg-background border border-primary shadow rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">
                {isTemplate ? ticket.title.slice(9) : ticket.title}
              </h1>
              <div className="text-sm text-primary/70 flex gap-4">
                <span>by {usernames[ticket.created_by] || 'unknown'}</span>
                <span>{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {profile?.role !== 'customer' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareTemplate}
                  disabled={!isTemplate}
                >
                  share template
                </Button>
              )}
              {(profile?.role === 'manager' || (profile?.role === 'worker' && ticket.created_by === user?.id)) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTemplateToggle}
                  disabled={updatingTicket}
                >
                  {isTemplate ? 'remove template' : 'make template'}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600">failed to {error}</div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-primary/70">status</span>
              {canUpdateStatus ? (
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">new</SelectItem>
                    <SelectItem value="open">open</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="resolved">resolved</SelectItem>
                    <SelectItem value="closed">closed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">{ticket.status}</p>
              )}
            </div>

            <div>
              <span className="text-sm text-primary/70">priority</span>
              {profile?.role === 'manager' || ticket.created_by === user?.id ? (
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => handlePriorityChange(value as TicketPriority)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                    <SelectItem value="urgent">urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">{ticket.priority}</p>
              )}
            </div>

            <div>
              <span className="text-sm text-primary/70">tags</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {ticketTags.map(tag => (
                  <div 
                    key={tag.id}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tag.name}
                    {isManagerOrWorker && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await removeTag(tag.id)
                          } catch (e) {
                            console.error('Error removing tag:', e)
                            setError('failed to remove tag')
                          }
                        }}
                        className="text-primary/70 hover:text-primary"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {isManagerOrWorker && (
                  <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20">
                        add tag
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-background border border-primary" align="start">
                      <Command className="w-full [&_[cmdk-input-wrapper]]:px-0">
                        <CommandInput 
                          placeholder="search tags..." 
                          className="h-9 w-full ring-0 focus:ring-0 focus-visible:ring-0 text-primary placeholder:text-primary/50" 
                          value={tagSearch} 
                          onValueChange={setTagSearch}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && tagSearch) {
                              e.preventDefault()
                              if (filteredTags.length === 1) {
                                const tag = filteredTags[0]
                                try {
                                  if (tag.id === 'create') {
                                    const newTag = await createTag(tagSearch.trim())
                                    if (newTag) {
                                      await addTag(newTag.id)
                                    }
                                  } else {
                                    await addTag(tag.id)
                                  }
                                  setTagSearchOpen(false)
                                  setTagSearch('')
                                } catch (e) {
                                  console.error('Error with tag:', e)
                                  setError('failed to handle tag')
                                }
                              }
                            }
                          }}
                        />
                        <CommandEmpty className="py-2 px-3 text-sm text-primary/50">no tags found</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {filteredTags.map(tag => (
                            <CommandItem
                              key={tag.id}
                              onSelect={async () => {
                                try {
                                  if (tag.id === 'create') {
                                    const newTag = await createTag(tagSearch.trim())
                                    if (newTag) {
                                      await addTag(newTag.id)
                                    }
                                  } else {
                                    await addTag(tag.id)
                                  }
                                  setTagSearchOpen(false)
                                  setTagSearch('')
                                } catch (e) {
                                  console.error('Error with tag:', e)
                                  setError('failed to handle tag')
                                }
                              }}
                              className={tag.id === 'create' 
                                ? "py-2 px-3 cursor-pointer hover:bg-primary/10 text-primary"
                                : "py-2 px-3 cursor-pointer hover:bg-primary/10 text-primary"}
                            >
                              {tag.id === 'create' ? `create "${tagSearch}"` : tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div>
              <span className="text-sm text-primary/70">assignee</span>
              {profile?.role === 'manager' || (profile?.role === 'worker' && (!ticket.assigned_to || ticket.assigned_to === user?.id)) ? (
                <Select
                  value={ticket.assigned_to || 'unassigned'}
                  onValueChange={(value) => handleAssignmentChange(value === 'unassigned' ? null : value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">unassigned</SelectItem>
                    {assignableMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {usernames[member.id] || member.username} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-primary">
                  {ticket.assigned_to ? usernames[ticket.assigned_to] || 'unknown' : 'unassigned'}
                </p>
              )}
            </div>
          </div>

          {ticket.description && (
            <div className="mt-6">
              <span className="text-sm text-primary/70">description</span>
              <p className="mt-1 text-primary whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {isManager && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-primary">custom fields</h3>
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

        <div className="bg-background border border-primary shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-primary mb-4">comments</h2>
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="border-b border-primary/20 last:border-0 pb-4">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-primary/70">
                    <span className="font-medium text-primary">{usernames[comment.created_by] || 'unknown'}</span>
                    <span className="mx-2">·</span>
                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                    {comment.internal && (
                      <>
                        <span className="mx-2">·</span>
                        <span className="text-yellow-500">internal</span>
                      </>
                    )}
                  </div>
                  {(profile?.role === 'manager' || (profile?.role === 'customer' && comment.created_by === user?.id)) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-primary whitespace-pre-wrap">{comment.content}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-primary/20">
            <h3 className="text-sm font-medium text-primary mb-4">add comment</h3>
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div>
                <Textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="write your comment..."
                  className="w-full"
                />
              </div>
              {isManagerOrWorker && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="internal"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                  />
                  <Label htmlFor="internal" className="text-primary">internal comment</Label>
                </div>
              )}
              <Button type="submit" disabled={!newComment.trim()}>
                add comment
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 