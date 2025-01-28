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
    const peerKey = req.headers.get('peer_key')
    let isStaff = peerKey === Deno.env.get('PLATFORM_KEY')
    
    if (!isStaff && authHeader) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
      if (!userError && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        isStaff = profile?.role === 'worker' || profile?.role === 'manager'
      }
    }

    // Get request data
    const { query, limit = 5 } = await req.json()
    if (!query) throw new Error('query required')

    console.log('Searching for:', query)

    // First check if any embeddings exist
    const { count, error: countError } = await supabase
      .from('kb_embeddings')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error checking embeddings:', countError)
      throw countError
    }

    console.log('Total embeddings in database:', count)

    // List all articles to verify embeddings
    const { data: articles, error: listError } = await supabase
      .from('kb_articles')
      .select('id, title')
      
    if (listError) {
      console.error('Error listing articles:', listError)
      throw listError
    }

    console.log('Articles in database:', articles)

    // Check embeddings for each article
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('kb_embeddings')
      .select('article_id')

    if (embeddingsError) {
      console.error('Error checking article embeddings:', embeddingsError)
      throw embeddingsError
    }

    const articleIds = new Set(embeddings?.map(e => e.article_id))
    const missingEmbeddings = articles?.filter(a => !articleIds.has(a.id))
    
    if (missingEmbeddings?.length) {
      console.log('Articles missing embeddings:', missingEmbeddings)
    }

    // Generate embedding for search query
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? ''
    })

    // Structure query like articles
    const searchText = `Title: Search query\nContent: ${query}\nKeywords: ${query.toLowerCase().split(/\s+/).join(' ')}`
    
    console.log('Generating embedding for structured query:', searchText)

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: searchText
    })

    if (!response.data[0]?.embedding) {
      throw new Error('No embedding generated')
    }

    console.log('Generated embedding for query')

    // Search for similar articles with lower threshold
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_kb_articles', {
        query_embedding: response.data[0].embedding,
        match_threshold: 0.01,
        match_count: limit,
        min_content_length: 0,
        is_staff: isStaff
      })

    if (searchError) {
      console.error('Search error:', searchError)
      throw searchError
    }

    console.log('Search results:', searchResults)

    return new Response(
      JSON.stringify({ articles: searchResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Search KB error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 