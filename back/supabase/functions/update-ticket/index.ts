import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UpdateTicketPayload {
  id: string
  title?: string
  description?: string
  status?: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  team_id?: string | null
  assigned_to?: string | null
  restricted?: boolean
  required_skills?: string[]
  field_values?: { [key: string]: string }
  tags?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    const { id, title, description, status, priority, team_id, assigned_to, restricted, required_skills, field_values, tags } = await req.json() as UpdateTicketPayload

    if (!id) throw new Error('ticket id required')

    // Get user role and check if they're the creator
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError) throw profileError

    // Get current ticket to check permissions
    const { data: currentTicket, error: ticketError } = await supabase
      .from('tickets')
      .select('created_by, assigned_to, team_id')
      .eq('id', id)
      .single()

    if (ticketError) throw ticketError

    // If worker is trying to assign to someone else, verify it's a manager
    let assigningToManager = false
    if (profile.role === 'worker' && assigned_to && assigned_to !== user.id) {
      const { data: targetUser, error: targetError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', assigned_to)
        .single()

      if (targetError) throw targetError
      assigningToManager = targetUser.role === 'manager'
    }

    // Build update object based on permissions
    const updateData: any = {}
    
    if (profile.role === 'manager') {
      // Managers can update everything
      updateData.title = title
      updateData.description = description
      updateData.status = status
      updateData.priority = priority
      updateData.team_id = team_id
      updateData.assigned_to = assigned_to
      updateData.restricted = restricted
    } else if (profile.role === 'worker') {
      if (currentTicket.assigned_to === user.id) {
        // Workers can update assigned tickets
        updateData.status = status
      }
      // Workers can assign/unassign themselves to unassigned tickets
      // OR assign to a manager
      if (currentTicket.assigned_to === null || currentTicket.assigned_to === user.id || assigningToManager) {
        updateData.assigned_to = assigned_to
      }
    } else if (profile.role === 'customer' && currentTicket.created_by === user.id) {
      // Customers can update priority of their tickets
      updateData.priority = priority
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('no valid updates permitted')
    }

    // Update ticket
    const { data: ticket, error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Only managers can update these related items
    if (profile.role === 'manager') {
      // Update required skills if provided
      if (required_skills) {
        // Delete existing skills
        await supabase
          .from('ticket_required_skills')
          .delete()
          .eq('ticket_id', id)

        // Add new skills
        if (required_skills.length) {
          const { error: skillsError } = await supabase
            .from('ticket_required_skills')
            .insert(
              required_skills.map(skill_id => ({
                ticket_id: id,
                skill_id
              }))
            )
          if (skillsError) throw skillsError
        }
      }

      // Update field values if provided
      if (field_values) {
        // Upsert field values
        const { error: fieldsError } = await supabase
          .from('ticket_field_values')
          .upsert(
            Object.entries(field_values).map(([field_id, value]) => ({
              ticket_id: id,
              field_id,
              value
            }))
          )
        if (fieldsError) throw fieldsError
      }

      // Update tags if provided
      if (tags) {
        // Delete existing tags
        await supabase
          .from('ticket_tag_links')
          .delete()
          .eq('ticket_id', id)

        // Add new tags
        if (tags.length) {
          const { error: tagsError } = await supabase
            .from('ticket_tag_links')
            .insert(
              tags.map(tag_id => ({
                ticket_id: id,
                tag_id
              }))
            )
          if (tagsError) throw tagsError
        }
      }
    }

    return new Response(
      JSON.stringify({ ticket }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 