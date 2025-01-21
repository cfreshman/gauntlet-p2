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

    const { id } = await req.json()
    if (!id) throw new Error('template id required')

    // Get template ticket
    const { data: template, error: templateError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .ilike('title', 'template: %')
      .single()

    if (templateError) throw templateError
    if (!template) throw new Error('template not found')

    return new Response(
      JSON.stringify(template),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 