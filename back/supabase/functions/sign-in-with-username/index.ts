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
    const { username, password } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('PLATFORM_URL')!,
      Deno.env.get('PLATFORM_KEY')!
    )

    // Get email for username
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('username', username.toLowerCase())
      .single()

    if (profileError || !profiles?.email) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'invalid credentials', status: 401 }
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

    // Sign in with email
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: profiles.email,
      password
    })

    if (authError) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'invalid credentials', status: 401 }
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

    return new Response(
      JSON.stringify(authData),
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