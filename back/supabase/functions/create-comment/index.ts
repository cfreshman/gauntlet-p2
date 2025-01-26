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

    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) throw new Error('no auth header')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('invalid auth')

    const { ticket_id, content, internal } = await req.json() as CreateCommentPayload

    if (!ticket_id) throw new Error('ticket id required')
    if (!content) throw new Error('content required')

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id,
        content,
        internal: internal || false,
        created_by: user.id
      })
      .select()
      .single()

    if (commentError) throw commentError

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