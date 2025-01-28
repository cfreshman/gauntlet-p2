import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.24.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get request data
    const { user_id, ticket_ids } = await req.json()
    if (!user_id) throw new Error('user_id is required')
    if (!ticket_ids?.length) throw new Error('ticket_ids is required')

    // Get user's role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single()

    if (!profile) throw new Error('profile not found')

    // Get full ticket details
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        created_at,
        updated_at,
        created_by,
        assigned_to,
        ticket_tag_links!left(ticket_tags(name)),
        ticket_comments!left(
          id,
          content,
          internal,
          created_at,
          created_by
        ),
        ticket_field_values!left(
          value,
          ticket_field_definitions!inner(
            name,
            type
          )
        ),
        ticket_feedback!left(
          id,
          rating,
          comment,
          created_at,
          created_by
        )
      `)
      .in('id', ticket_ids)
      .order('created_at', { ascending: false })

    if (ticketsError) throw ticketsError
    if (!tickets?.length) {
      return new Response(
        JSON.stringify({ summary: 'no tickets found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Collect all user IDs
    const userIds = new Set<string>()
    tickets.forEach(ticket => {
      if (ticket.created_by) userIds.add(ticket.created_by)
      if (ticket.assigned_to) userIds.add(ticket.assigned_to)
      ticket.ticket_comments?.forEach(comment => {
        if (comment.created_by) userIds.add(comment.created_by)
      })
    })

    // Get usernames
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, role')
      .in('id', Array.from(userIds))

    const usernames = (profiles || []).reduce((acc, profile) => {
      acc[profile.id] = `${profile.username} (${profile.role})`
      return acc
    }, {} as Record<string, string>)
    usernames[null] = 'ai assistant'

    // Add username table to the prompt
    const usernameTable = Object.entries(usernames)
      .map(([id, name]) => `${id}: ${name}`)
      .join('\n')

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    // Get current user's details for the prompt
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user_id)
      .single()

    // Format tickets for prompt
    const ticketDetails = tickets.map(ticket => {
      const tags = ticket.ticket_tag_links?.map(t => t.ticket_tags.name).join(', ') || 'no tags'
      const customFields = ticket.ticket_field_values
        ?.map(f => `${f.ticket_field_definitions.name}: ${f.value}`)
        .join('\n- ') || 'no custom fields'
      
      const comments = ticket.ticket_comments
        ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        ?.map(c => `[${new Date(c.created_at).toLocaleString()}] ${usernames[c.created_by] || 'unknown'}${c.internal ? ' (internal)' : ''}: ${c.content}`)
        .join('\n') || 'no comments'

      const feedback = ticket.ticket_feedback
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        ?.map(f => `[${new Date(f.created_at).toLocaleString()}] ${usernames[f.created_by] || 'unknown'}: ${f.rating}/5 stars${f.comment ? ` - ${f.comment}` : ''}`)
        .join('\n') || 'no feedback'
      
      return `Ticket ${ticket.id}:
- Title: ${ticket.title}
- Description: ${ticket.description}
- Status: ${ticket.status}
- Priority: ${ticket.priority}
- Tags: ${tags}
- Created: ${new Date(ticket.created_at).toLocaleDateString()} by ${usernames[ticket.created_by] || 'unknown'}
- Assigned to: ${ticket.assigned_to ? usernames[ticket.assigned_to] || 'unknown' : 'unassigned'}
- Last Updated: ${new Date(ticket.updated_at).toLocaleDateString()}
- Custom Fields:
  - ${customFields}

Comments:
${comments}

Feedback:
${feedback}`
    }).join('\n\n---\n\n')

    // Generate summary
    const messages = [
      {
        role: 'system',
        content: `You are a ticket workload summarization tool for user: "${currentUser.username}" who is a: "${currentUser.role.toUpperCase()}". It is ${new Date().toLocaleDateString()}. Your response will be shown to them directly.

Provide a clear, concise summary focusing on what needs attention first. 
This will appear in a small card UI at the top of programmatic ticket counts. It shouldn't be too long, and should make sense without specifically telling the user what to do - that would anger them.
MANAGERS' role is to assign tickets and oversee worker's progress. They should receive an overview of their team's progress. Do not say "YOU" have tickets that need attention - the TEAM has tickets. Tickets currently assigned to a manager should usually be assigned to a worker, unless the manager is actually taking care of the ticket.
WORKERS should be directed to their own tickets. These ARE NOT the TEAM'S tickets, they are the WORKER'S tickets.

Use full URLs when referencing tickets (${Deno.env.get('APP_HOSTNAME')}/tickets/[id]). These links will be displayed as "title: <the ticket's title>", so don't repeat "ticket" or the title in your text.
Do not introduce the ticket and then link in a parenthesis. Just link the ticket directly where you're talking about it because, again, it will appear as "title: <the ticket's title>" in the UI.

DO NOT USE MARKDOWN. i repeat do not use markdown text formatting.

include any highly important information but BE CONCISE so people can actually read your summary.

Ticket Status Flow:
- new: just created, needs initial review
- open: being worked on
- pending: waiting on customer or external input
- resolved: work is complete, waiting for customer confirmation
- closed: confirmed complete by customer or manager

Ticket Priority Levels:
- urgent: needs immediate attention
- high: address after urgent tickets
- medium: standard priority
- normal: no rush

ignore resolved tickets unless the customer have left feedback or responded with a comment (the resolution may be confirmed and we can close the ticket, or it may need rework and we should change the status back to open or pending)

again, the WORKER vs MANAGER summaries should be quite different. think about what is useful for each. MANAGERS should still get ticket links though.

do not say annoying things like "Address these tickets promptly to keep the workflow smooth and customers satisfied."
do not reference tickets in some form other than a correct link. do not say "the ticket regarding blah blah blah" - just link the ticket.
if there are clear actions to take, like closing a ticket with positive feedback, you should say so.
DO NOT describe the link's title. it will already be in the UI.

DO NOT FUCKING USE MARKDOWN.

User ID reference table (with roles):
${usernameTable}`
      },
      {
        role: 'user',
        content: ticketDetails
      }
    ]

    console.log('LLM Prompt:', JSON.stringify(messages, null, 2))

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    })

    const summary = completion.choices[0].message.content
    console.log('LLM Response:', summary)

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Generate ticket summary error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 