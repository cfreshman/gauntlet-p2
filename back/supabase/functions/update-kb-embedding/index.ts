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
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    )

    // Get request data
    const { article_id, title, content } = await req.json()
    if (!article_id || !title || !content) throw new Error('article_id, title, and content required')

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? ''
    })

    // Generate embedding with better structure
    // Format: "Title: {title} Content: {content} Keywords: {extracted keywords}"
    const keywords = extractKeywords(title, content)
    const text = `Title: ${title}\nContent: ${content}\nKeywords: ${keywords}`
    
    console.log('Generating embedding for article:', { article_id, title, keywords })

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    })

    if (!response.data[0]?.embedding) {
      throw new Error('No embedding generated')
    }

    console.log('Generated embedding, upserting to database')

    // Upsert embedding
    const { error: upsertError } = await supabase
      .from('kb_embeddings')
      .upsert({
        article_id,
        embedding: response.data[0].embedding
      })

    if (upsertError) {
      console.error('Error upserting embedding:', upsertError)
      throw upsertError
    }

    console.log('Successfully updated embedding for article:', article_id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Update KB embedding error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// Helper to extract keywords from title and content
function extractKeywords(title: string, content: string): string {
  // Convert to lowercase and split into words
  const words = (title + ' ' + content)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out short words
  
  // Count word frequencies
  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Sort by frequency and get top keywords
  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
    .join(' ')
} 