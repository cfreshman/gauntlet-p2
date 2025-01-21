import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SignUpPayload {
  email: string
  password: string
  username: string
  inviteId?: string | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, username, inviteId } = await req.json() as SignUpPayload

    if (!email || !password || !username) {
      throw new Error('email, password and username required')
    }

    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    // Default role is customer
    let role = 'customer'
    let invite = null

    // If invite ID provided, verify it and get role
    if (inviteId) {
      console.log('Checking invite:', inviteId)
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_invites')
        .select('role, status, team_id')
        .eq('id', inviteId)
        .single()

      if (inviteError) {
        console.error('Invite error:', inviteError)
        throw new Error('invalid invite')
      }

      if (!inviteData) {
        console.error('No invite found')
        throw new Error('invalid invite')
      }

      if (inviteData.status !== 'pending') {
        console.error('Invite not pending:', inviteData.status)
        throw new Error('invite has expired')
      }

      invite = inviteData
      role = invite.role
    }

    console.log('Creating user with role:', role)

    // Create user
    console.log('Attempting to create user with email:', email)
    const createUserResponse = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    })
    
    console.log('Create user response:', JSON.stringify(createUserResponse))

    const { data: { user }, error: signUpError } = createUserResponse

    if (signUpError) {
      console.error('Signup error:', signUpError)
      throw signUpError
    }

    if (!user) {
      console.error('No user created')
      throw new Error('failed to create user')
    }

    console.log('Created auth user:', user.id)

    // Check if this is the first user (most performant way)
    const { data: hasProfiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()

    // First user is manager, unless they have an invite
    if (!inviteId && !hasProfiles) {
      console.log('First user - setting as manager')
      role = 'manager'
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        email,
        role
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Cleanup: delete user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id)
      throw new Error('failed to create profile')
    }

    // If invite was used, add to team_members and mark as accepted
    if (inviteId && invite.team_id) {
      // Add to team_members
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          team_id: invite.team_id,
          user_id: user.id
        })

      if (teamError) {
        console.error('Team error:', teamError)
        // Cleanup: delete user if team member creation fails
        await supabase.auth.admin.deleteUser(user.id)
        throw new Error('failed to add team member')
      }

      const { error: updateError } = await supabase
        .from('team_invites')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteId)

      if (updateError) {
        console.error('Failed to update invite:', updateError)
        // Don't throw here, user is already created
      }
    }

    // Sign in the user
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
      throw signInError
    }

    if (!session) {
      console.error('No session created')
      throw new Error('failed to create session')
    }

    return new Response(
      JSON.stringify({ session }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Sign up error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 