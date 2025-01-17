const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  try {
    const { username, password } = JSON.parse(event.body)
    
    // Get supabase admin client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Get email for username
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', username.toLowerCase())
      .single()

    if (profileError || !profiles?.email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: { message: 'invalid credentials', status: 401 }
        })
      }
    }

    // Sign in with email
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: profiles.email,
      password
    })

    if (authError) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: { message: 'invalid credentials', status: 401 }
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(authData)
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: { message: 'server error', status: 500 }
      })
    }
  }
} 