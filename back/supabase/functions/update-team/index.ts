import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface UpdateTeamPayload {
  id: string
  name?: string
  members?: string[] // user ids
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

    // Verify user is a manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (profile.role !== 'manager') throw new Error('unauthorized')

    const { id, name, members } = await req.json() as UpdateTeamPayload
    if (!id) throw new Error('team id required')

    // Update team name if provided
    if (name) {
      const { error: updateError } = await supabase
        .from('teams')
        .update({ name })
        .eq('id', id)

      if (updateError) throw updateError
    }

    // Update members if provided
    if (members !== undefined) {
      // Delete existing members
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', id)

      // Add new members
      if (members.length) {
        const { error: membersError } = await supabase
          .from('team_members')
          .insert(
            members.map(user_id => ({
              team_id: id,
              user_id
            }))
          )
        if (membersError) throw membersError
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 