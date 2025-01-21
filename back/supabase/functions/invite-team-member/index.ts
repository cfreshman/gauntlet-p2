import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface InviteTeamMemberPayload {
  role: 'worker' | 'manager',
  team_id?: string
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

    // Get auth user
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
    if (profile.role !== 'manager') throw new Error('only managers can invite team members')

    // Get invite data
    const { role, team_id } = await req.json() as InviteTeamMemberPayload
    if (!role) throw new Error('role required')
    if (!['worker', 'manager'].includes(role)) throw new Error('invalid role')

    // If team_id provided, verify manager is part of that team
    if (team_id) {
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('team_id', team_id)
        .single()

      if (teamError || !teamMember) throw new Error('manager must be part of the specified team')
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        role,
        team_id,
        invited_by: user.id
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    return new Response(
      JSON.stringify({ 
        success: true,
        invite_id: invite.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 