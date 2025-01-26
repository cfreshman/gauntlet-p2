import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

    const { id } = await req.json()
    if (!id) throw new Error('comment id required')

    // Get ticket_id before deletion
    const { data: comment, error: getError } = await supabase
      .from('ticket_comments')
      .select('ticket_id')
      .eq('id', id)
      .single()

    if (getError) throw getError
    if (!comment) throw new Error('comment not found')

    // Delete comment
    const { error: deleteError } = await supabase
      .from('ticket_comments')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Update ticket embedding
    await supabase.functions.invoke('generate-ticket-embedding', {
      body: { ticket_id: comment.ticket_id }
    }).catch(err => console.error('Error updating embedding:', err))

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