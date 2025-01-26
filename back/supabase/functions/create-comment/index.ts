import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateCommentPayload {
  ticket_id: string
  content: string
  internal?: boolean
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

    // Check if this is a peer function call by checking peer_key header
    const isServiceRole = req.headers.get('peer_key') === Deno.env.get('PLATFORM_KEY')
    
    // Only check user auth for non-service role calls
    let user
    if (!isServiceRole) {
      const authHeader = req.headers.get('Authorization')?.split(' ')[1]
      if (!authHeader) throw new Error('no auth header')
      
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(authHeader)
      if (userError || !authUser) throw new Error('invalid auth')
      user = authUser
    }

    const { ticket_id, content, internal } = await req.json()
    if (!ticket_id || !content) throw new Error('ticket_id and content required')

    // Create comment
    const { data: comment, error: insertError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id,
        content,
        internal: internal ?? false,
        created_by: isServiceRole ? null : user.id
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Update ticket embedding - don't block on errors
    try {
      await supabase.functions.invoke('generate-ticket-embedding', {
        body: { ticket_id }
      })
    } catch (err) {
      // Log but don't fail the comment creation
      console.error('Error updating embedding:', err)
    }

    return new Response(
      JSON.stringify({ comment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 