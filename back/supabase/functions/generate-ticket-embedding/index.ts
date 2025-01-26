import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.24.1'
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

    // Get request data
    const { ticket_id } = await req.json()
    if (!ticket_id) {
      throw new Error('ticket_id required')
    }

    // Get ticket data
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        title,
        description,
        status,
        priority
      `)
      .eq('id', ticket_id)
      .single()

    if (ticketError) throw ticketError

    // Get comments
    const { data: comments } = await supabase
      .from('ticket_comments')
      .select('content')
      .eq('ticket_id', ticket_id)
      .eq('internal', false)
      .order('created_at', { ascending: true })

    // Get tags
    const { data: ticketTags } = await supabase
      .from('ticket_tag_links')
      .select('ticket_tags (name)')
      .eq('ticket_id', ticket_id)

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? ''
    })

    // Structure ticket data for embedding
    const ticketText = [
      `Title: ${ticket.title}`,
      `Description: ${ticket.description}`,
      ticket.status && `Status: ${ticket.status}`,
      ticket.priority && `Priority: ${ticket.priority}`,
      ticketTags?.length && `Tags: ${ticketTags.map(t => t.ticket_tags.name).join(', ')}`,
      comments?.length && [
        'Comments:',
        ...comments.map(c => `- ${c.content}`)
      ].join('\n')
    ].filter(Boolean).join('\n')

    // Generate embedding
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: ticketText
    })

    if (!response.data[0]?.embedding) {
      throw new Error('No embedding generated')
    }

    // Store metadata
    const metadata = {
      status: ticket.status,
      priority: ticket.priority,
      tag_count: ticketTags?.length ?? 0,
      tags: ticketTags?.map(t => t.ticket_tags.name) ?? [],
      comment_count: comments?.length ?? 0
    }

    // Upsert embedding
    const { error: embeddingError } = await supabase
      .from('ticket_embeddings')
      .upsert({
        ticket_id,
        embedding: response.data[0].embedding,
        metadata
      })

    if (embeddingError) throw embeddingError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Generate ticket embedding error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 