import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.24.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    // Get auth user and role
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    let isStaff = false
    let userId = null
    
    if (authHeader) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
      if (!userError && user) {
        userId = user.id
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        isStaff = profile?.role === 'worker' || profile?.role === 'manager'
      }
    }

    // Get request data
    const { query, ticket_id, limit = 5 } = await req.json()
    if (!query && !ticket_id) throw new Error('query or ticket_id required')

    console.log('Searching with:', { query, ticket_id, limit })

    // First check if any embeddings exist
    const { count, error: countError } = await supabase
      .from('ticket_embeddings')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error checking embeddings:', countError)
      throw countError
    }

    console.log('Total embeddings in database:', count)

    let searchText = query

    // If ticket_id provided, get ticket data
    if (ticket_id) {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          title,
          description,
          status,
          priority,
          ticket_tag_links!left (
            ticket_tags (
              name
            )
          ),
          ticket_comments!left (
            content
          )
        `)
        .eq('id', ticket_id)
        .eq('ticket_comments.internal', false)
        .single()

      if (ticketError) throw ticketError
      if (!ticket) throw new Error('Ticket not found')

      // Structure ticket data like we do for embedding generation
      searchText = [
        `Title: ${ticket.title}`,
        `Description: ${ticket.description}`,
        ticket.status && `Status: ${ticket.status}`,
        ticket.priority && `Priority: ${ticket.priority}`,
        ticket.ticket_tag_links?.length && `Tags: ${ticket.ticket_tag_links.map(t => t.ticket_tags.name).join(', ')}`,
        ticket.ticket_comments?.length && [
          'Comments:',
          ...ticket.ticket_comments.map(c => `- ${c.content}`)
        ].join('\n')
      ].filter(Boolean).join('\n')
    } else {
      // Structure search query like tickets
      searchText = `Title: Search query\nDescription: ${query}\nKeywords: ${query.toLowerCase().split(/\s+/).join(' ')}`
    }

    console.log('Generating embedding for structured text:', searchText)

    // Generate embedding for search
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? ''
    })

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: searchText
    })

    if (!response.data[0]?.embedding) {
      throw new Error('No embedding generated')
    }

    console.log('Generated embedding for search')

    // Search for similar tickets with lower threshold
    const { data: results, error: searchError } = await supabase
      .rpc('search_similar_tickets', {
        query_embedding: response.data[0].embedding,
        match_threshold: 0.01,
        match_count: limit,
        requesting_user_id: userId
      })

    if (searchError) {
      console.error('Search error:', searchError)
      throw searchError
    }

    // Deduplicate results by ticket ID
    const uniqueResults = new Map()
    results.forEach((result) => {
      const existing = uniqueResults.get(result.id)
      if (!existing || result.similarity > existing.similarity) {
        uniqueResults.set(result.id, result)
      }
    })

    console.log('Search results:', Array.from(uniqueResults.values()))

    return new Response(
      JSON.stringify({ tickets: Array.from(uniqueResults.values()) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Search similar tickets error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 