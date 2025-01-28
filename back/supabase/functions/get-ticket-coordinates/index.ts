import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { UMAP } from 'https://esm.sh/umap-js@1.3.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate environment variables
    const platformUrl = Deno.env.get('PLATFORM_URL')
    const platformKey = Deno.env.get('PLATFORM_KEY')
    
    if (!platformUrl || !platformKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(platformUrl, platformKey)

    // Get request data
    const { ticket_ids } = await req.json()
    console.log('Processing ticket_ids:', ticket_ids)

    if (!ticket_ids?.length) {
      return new Response(
        JSON.stringify({ points: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get embeddings for these tickets
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('ticket_embeddings')
      .select('ticket_id, embedding')
      .in('ticket_id', ticket_ids)

    if (embeddingsError) {
      console.error('Error fetching embeddings:', embeddingsError)
      throw embeddingsError
    }

    console.log(`Found ${embeddings?.length ?? 0} embeddings`)
    
    // Debug embedding format
    if (embeddings?.length) {
      console.log('First embedding type:', typeof embeddings[0].embedding)
      console.log('First embedding:', embeddings[0].embedding)
      if (typeof embeddings[0].embedding === 'string') {
        try {
          // Try parsing if it's a JSON string
          embeddings.forEach(e => {
            e.embedding = JSON.parse(e.embedding)
          })
          console.log('Parsed embeddings from JSON strings')
        } catch (parseError) {
          console.error('Failed to parse embedding JSON:', parseError)
        }
      }
    }

    // Skip UMAP if no embeddings
    if (!embeddings?.length) {
      return new Response(
        JSON.stringify({ points: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate embeddings format
    const validEmbeddings = embeddings.filter(e => Array.isArray(e.embedding) && e.embedding.length > 0)
    if (validEmbeddings.length === 0) {
      console.error('No valid embeddings found. Sample embedding:', embeddings[0])
      return new Response(
        JSON.stringify({ points: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Computing UMAP with', validEmbeddings.length, 'embeddings')

    // Convert embeddings to 2D using UMAP
    const umap = new UMAP({
      nComponents: 2,
      nNeighbors: Math.min(15, Math.max(2, Math.floor(validEmbeddings.length / 2))),
      minDist: 0.1,
      nEpochs: 100 // Limit epochs to prevent timeout
    })

    try {
      const coordinates = umap.fit(validEmbeddings.map(e => e.embedding))
      console.log('UMAP computation complete')

      // Normalize coordinates to [0,1] range
      const xValues = coordinates.map(c => c[0])
      const yValues = coordinates.map(c => c[1])
      const xMin = Math.min(...xValues)
      const xMax = Math.max(...xValues)
      const yMin = Math.min(...yValues)
      const yMax = Math.max(...yValues)

      const xRange = xMax - xMin
      const yRange = yMax - yMin

      const points = validEmbeddings.map((embedding, i) => ({
        id: embedding.ticket_id,
        x: (coordinates[i][0] - xMin) / (xRange || 1),
        y: (coordinates[i][1] - yMin) / (yRange || 1)
      }))

      return new Response(
        JSON.stringify({ points }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (umapError) {
      console.error('UMAP computation error:', umapError)
      throw new Error('Failed to compute coordinates: ' + umapError.message)
    }

  } catch (err) {
    console.error('Get ticket coordinates error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 