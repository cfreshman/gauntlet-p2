// @ts-ignore: Deno uses URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { identifier } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('PLATFORM_URL')!,
      Deno.env.get('PLATFORM_KEY')!
    )

    // Try username first
    let { data: profiles } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('username', identifier.toLowerCase())
      .single()

    // If no result, try email
    if (!profiles?.email) {
      const { data: emailProfiles } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('email', identifier.toLowerCase())
        .single()
      
      profiles = emailProfiles
    }

    if (!profiles?.email) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'invalid username or email', status: 401 }
        }),
        { 
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 401,
        }
      )
    }

    // Send reset email
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(
      profiles.email,
      { redirectTo: `${req.headers.get('origin')}/update-password` }
    )

    if (resetError) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'reset failed', status: 500 }
        }),
        { 
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200,
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: { message: 'server error', status: 500 }
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500,
      }
    )
  }
}) 