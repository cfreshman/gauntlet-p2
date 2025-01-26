import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.24.1'
import { corsHeaders } from '../_shared/cors.ts'

type Action = 
  | { type: 'set_status', status: 'resolved' }
  | { type: 'set_assignee', team_id: string, staff_id: string }
  | { 
      type: 'add_comment', 
      content: string,
      references?: Array<
        | { type: 'article', id: string }
        | { type: 'ticket', id: string }
      >
    }
  | { type: 'debug_log', message: string }

type AutoResponse = {
  actions: Action[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticket_id } = await req.json()
    if (!ticket_id) throw new Error('ticket_id is required')

    console.log('Processing ticket:', ticket_id)

    // Initialize clients
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    // Get ticket data
    console.log('Fetching ticket data...')
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket_id)
      .single()

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError)
      throw ticketError
    }
    if (!ticket) {
      console.error('Ticket not found:', ticket_id)
      throw new Error(`Ticket ${ticket_id} not found`)
    }

    console.log('Found ticket:', ticket.id, ticket.title)

    // Parallelize KB and ticket searches
    const [kbResults, ticketResults] = await Promise.all([
      // Search KB articles
      supabase.functions.invoke('search-kb', {
        body: { query: `${ticket.title}\n${ticket.description}` }
      }).then(res => {
        if (res.error) throw res.error
        return res.data
      }),

      // Search similar tickets
      supabase.functions.invoke('search-similar-tickets', {
        body: { query: `${ticket.title}\n${ticket.description}` }
      }).then(res => {
        if (res.error) throw res.error
        return res.data
      })
    ])

    // Get full article content for each result in parallel
    const [articles, tickets] = await Promise.all([
      // Fetch article content
      Promise.all(
        kbResults.articles.map(async (article) => {
          try {
            const { data, error: downloadError } = await supabase.storage
              .from('kb')
              .download(`${article.id}.md`)

            if (downloadError) {
              console.error('Error downloading article content:', downloadError)
              return article // Return article without content if download fails
            }

            const content = await data.text()
            return {
              ...article,
              content
            }
          } catch (err) {
            console.error('Error processing article:', err)
            return article // Return article without content on error
          }
        })
      ),

      // Fetch full ticket details including resolutions
      Promise.all(
        ticketResults.tickets.map(async (ticket) => {
          try {
            const { data, error } = await supabase
              .from('tickets')
              .select(`
                *,
                comments:ticket_comments(
                  content,
                  created_at,
                  internal
                )
              `)
              .eq('id', ticket.id)
              .single()

            if (error) {
              console.error('Error fetching ticket details:', error)
              return ticket
            }

            return {
              ...ticket,
              ...data,
              resolution: data.comments
                ?.filter(c => !c.internal)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                ?.content || null
            }
          } catch (err) {
            console.error('Error processing ticket:', err)
            return ticket
          }
        })
      )
    ])

    // Get team data for routing
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
    if (teamsError) throw teamsError

    // Get staff data for routing
    const { data: staff, error: staffError } = await supabase
      .from('profiles')
      .select('id, username, role')
      .in('role', ['worker', 'manager'])
    if (staffError) throw staffError

    // Prepare prompt with context
    const prompt = {
      role: "system",
      content: `You are an AI support agent that processes new support tickets. You have access to:
1. Knowledge base articles
2. Similar historical tickets
3. Team and staff information

Your task is to:
1. If you find a KB article or similar ticket that directly answers the user's issue:
   - Set status to resolved
   - Add a clear comment explaining the resolution with article references
   - Assign to an appropriate staff member for follow-up if needed
   - Be confident in your resolution - if you understand the solution, resolve it

2. If you find relevant information that partially addresses the issue:
   - Add a comment with the helpful context and suggestions
   - Try to assign to an appropriate team/staff member
   - Do not auto-resolve, let the assigned staff member handle it

3. If you don't find relevant information to help:
   - Do nothing (return empty actions array)
   - Let human staff handle it from scratch

IMPORTANT FORMATTING RULES:
- DO NOT use markdown formatting in comments
- DO NOT include URLs or links in comments

Return a JSON response with an array of actions to take. Each action should be one of:
{ type: 'set_status', status: 'resolved' }
{ type: 'set_assignee', team_id: string, staff_id: string }
{ type: 'add_comment', content: string, references?: Array<{ type: 'article' | 'ticket', id: string }> }
{ type: 'debug_log', message: string }

You MUST include debug_log actions explaining:
- What action you are taking and why
- If you are not taking any action, explain exactly why not

The comment should be friendly and clear, with references ordered by relevance to your explanation.

Remember: If you understand the solution from the KB article or similar ticket, be confident and resolve it. Don't be overly cautious - if you can explain the solution clearly, that means you understand it well enough to resolve the ticket.`
    }

    const userMessage = {
      role: "user", 
      content: `New Ticket:
Title: ${ticket.title}
Description: ${ticket.description}
Priority: ${ticket.priority}
Created by: ${ticket.created_by}

Relevant KB Articles:
${articles.map((a: any) => `ID: ${a.id}\nTitle: ${a.title}\nContent: ${a.content}\nMatch: ${Math.round(a.similarity * 100)}%`).join('\n\n')}

Similar Tickets:
${tickets.map((t: any) => `ID: ${t.id}\nTitle: ${t.title}\nDescription: ${t.description}\nResolution: ${t.resolution}\nStatus: ${t.status}\nMatch: ${Math.round(t.similarity * 100)}%`).join('\n\n')}

Teams:
${teams.map((t: any) => `ID: ${t.id}\nName: ${t.name}`).join('\n\n')}

Staff:
${staff.map((s: any) => `ID: ${s.id}\nUsername: ${s.username}\nRole: ${s.role}`).join('\n\n')}`
    }

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [prompt, userMessage],
      temperature: 0,
      response_format: { type: "json_object" }
    })

    let response: AutoResponse
    try {
      response = JSON.parse(completion.choices[0].message.content || '{"actions": []}')
      console.log('Full AI response:', JSON.stringify(response, null, 2))
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      response = { actions: [] }
    }

    // Execute actions
    for (const action of response.actions) {
      switch (action.type) {
        case 'set_status':
          console.log('Setting status:', action.status)
          const statusRes = await supabase.functions.invoke('update-ticket', {
            body: { id: ticket_id, status: action.status },
            headers: { peer_key: Deno.env.get('PLATFORM_KEY') }
          })
          if (statusRes.error) {
            const errorBody = await statusRes.error.context.text()
            console.error('Status update error:', errorBody)
          } else {
            console.log('Status update response:', statusRes)
          }
          break

        case 'set_assignee':
          console.log('Setting assignee:', action.staff_id, 'team:', action.team_id)
          const assignRes = await supabase.functions.invoke('update-ticket', {
            body: { 
              id: ticket_id, 
              team_id: action.team_id,
              assigned_to: action.staff_id
            },
            headers: { peer_key: Deno.env.get('PLATFORM_KEY') }
          })
          if (assignRes.error) {
            const errorBody = await assignRes.error.context.text()
            console.error('Assignment update error:', errorBody)
          } else {
            console.log('Assignment update response:', assignRes)
          }
          break

        case 'add_comment':
          console.log('Adding comment:', action.content)
          
          // Construct comment with URLs
          let commentText = action.content
          if (action.references?.length) {
            commentText += '\n\nReferences:\n'
            for (const ref of action.references) {
              const url = ref.type === 'article' 
                ? `${Deno.env.get('APP_HOSTNAME')}/help/${ref.id}`
                : `${Deno.env.get('APP_HOSTNAME')}/tickets/${ref.id}`
              commentText += `- ${url}\n`
            }
          }

          const commentRes = await supabase.functions.invoke('create-comment', {
            body: {
              ticket_id,
              content: commentText,
              internal: false
            },
            headers: { peer_key: Deno.env.get('PLATFORM_KEY') }
          })
          if (commentRes.error) {
            const errorBody = await commentRes.error.context.text()
            console.error('Comment create error:', errorBody)
          } else {
            console.log('Comment create response:', commentRes)
          }
          break

        case 'debug_log':
          console.log('Debug:', action.message)
          break
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 