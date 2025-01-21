import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateTicketPayload {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  team_id?: string
  required_skills?: string[]
  field_values?: { [key: string]: string }
  tags?: string[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    // Get auth user
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    // Get request data
    const { title, description, priority, team_id, required_skills, field_values, tags } = await req.json() as CreateTicketPayload
    console.log('Received request data:', { title, description, priority, team_id, field_values, tags })

    // Validate required fields
    if (!title) throw new Error('title required')

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        priority: priority ?? 'medium',
        team_id,
        created_by: user.id
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      throw ticketError
    }
    console.log('Created ticket:', ticket)

    // Add required skills if provided
    if (required_skills?.length) {
      const { error: skillsError } = await supabase
        .from('ticket_required_skills')
        .insert(
          required_skills.map(skill_id => ({
            ticket_id: ticket.id,
            skill_id
          }))
        )
      if (skillsError) {
        console.error('Error adding skills:', skillsError)
        throw skillsError
      }
    }

    // Add field values if provided
    if (field_values && Object.keys(field_values).length > 0) {
      console.log('Attempting to add field values:', field_values)
      const fieldValueRows = Object.entries(field_values).map(([field_id, value]) => ({
        ticket_id: ticket.id,
        field_id,
        value
      }))
      console.log('Prepared field value rows:', fieldValueRows)

      const { data: insertedValues, error: fieldsError } = await supabase
        .from('ticket_field_values')
        .insert(fieldValueRows)
        .select()

      if (fieldsError) {
        console.error('Error adding field values:', fieldsError)
        throw fieldsError
      }
      console.log('Successfully inserted field values:', insertedValues)
    } else {
      console.log('No field values to add')
    }

    // Add tags if provided
    if (tags?.length) {
      const { error: tagsError } = await supabase
        .from('ticket_tag_links')
        .insert(
          tags.map(tag_id => ({
            ticket_id: ticket.id,
            tag_id
          }))
        )
      if (tagsError) {
        console.error('Error adding tags:', tagsError)
        throw tagsError
      }
    }

    return new Response(
      JSON.stringify({ ticket }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Create ticket error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 