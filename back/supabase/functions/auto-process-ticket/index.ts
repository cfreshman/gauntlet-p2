import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.24.1'
import Langfuse from 'npm:langfuse'
import { corsHeaders } from '../_shared/cors.ts'

type Action = 
  | { type: 'set_status', status: 'resolved' }
  | { type: 'set_assignee', team_id: string, staff_id: string }
  | { 
      type: 'add_comment', 
      content: string,
      internal?: boolean,
      references?: Array<
        | { type: 'article', id: string }
        | { type: 'ticket', id: string }
      >
    }
  | { type: 'debug_log', message: string }

type AutoResponse = {
  actions: Action[]
}

type StaffMember = {
  id: string
  username: string
  role: 'worker' | 'manager'
}

type Team = {
  id: string
  name: string
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
    const langfuse = new Langfuse({
      publicKey: Deno.env.get('LANGFUSE_PUBLIC_KEY') ?? '',
      secretKey: Deno.env.get('LANGFUSE_SECRET_KEY') ?? '',
      baseUrl: Deno.env.get('LANGFUSE_HOST') ?? 'https://cloud.langfuse.com'
    })

    // Get ticket data
    console.log('Fetching ticket data...')
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, ticket_tag_links!left(ticket_tags(id, name)), ticket_field_values!left(value, ticket_field_definitions!inner(name))')
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

    // Search KB articles and similar tickets in parallel
    const [kbResults, similarResults] = await Promise.all([
      supabase.functions.invoke('search-kb', {
        body: { query: `${ticket.title}\n${ticket.description}` },
        headers: {
          'peer_key': Deno.env.get('PLATFORM_KEY')
        }
      }),
      supabase.functions.invoke('search-similar-tickets', {
        body: { 
          query: `${ticket.title}\n${ticket.description}`,
          // Pass a system user ID that has staff permissions
          requesting_user_id: ticket.assigned_to || ticket.created_by
        },
        headers: {
          'peer_key': Deno.env.get('PLATFORM_KEY')
        }
      })
    ])

    if (kbResults.error) throw kbResults.error
    if (similarResults.error) throw similarResults.error

    // Get full article content for each result in parallel
    const articles = await Promise.all(
      kbResults.data.articles.map(async (article) => {
        try {
          // First get article metadata
          const { data: metadata, error: metadataError } = await supabase
            .from('kb_articles')
            .select('*')
            .eq('id', article.id)
            .single()

          if (metadataError) {
            console.error('Error fetching article metadata:', metadataError)
            return article
          }

          // Then get content
          const { data, error: downloadError } = await supabase.storage
            .from('kb')
            .download(`${article.id}.md`)

          if (downloadError) {
            console.error('Error downloading article content:', downloadError)
            return { ...metadata, ...article } // Return metadata even if content fails
          }

          const content = await data.text()
          return {
            ...metadata,
            ...article,
            content
          }
        } catch (err) {
          console.error('Error processing article:', err)
          return article
        }
      })
    )

    // Get full ticket data for each similar result
    const similarTickets = await Promise.all(
      (similarResults.data?.tickets || []).map(async (result) => {
        try {
          const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select(`
              *,
              ticket_tag_links!left(ticket_tags(name)),
              ticket_field_values!left(value, ticket_field_definitions!inner(name)),
              ticket_comments!left(content, internal, created_by)
            `)
            .eq('id', result.id)
            .single()

          if (ticketError) {
            console.error('Error fetching ticket data:', ticketError)
            return result
          }

          return {
            ...ticketData,
            similarity: result.similarity
          }
        } catch (err) {
          console.error('Error processing similar ticket:', err)
          return result
        }
      })
    )

    // Create trace now that we have all the initial data
    const trace = langfuse.trace({
      id: `ticket-${ticket_id}`,
      name: 'auto-process-ticket',
      input: {
        ticket: {
          id: ticket_id,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          tags: ticket.ticket_tag_links?.map((link: any) => link.ticket_tags.name) || []
        },
        matchedArticles: articles.map(a => ({
          id: a.id,
          title: a.title,
          similarity: Math.round(a.similarity * 100),
          isPublished: Boolean(a.published)
        })),
        similarTickets: similarTickets.map(t => ({
          id: t.id,
          title: t.title,
          similarity: Math.round(t.similarity * 100)
        }))
      }
    })

    // Get team and staff data
    const [teamsData, teamMembershipsData, staffData, staffSkillsData] = await Promise.all([
      // Get team data
      supabase.from('teams').select('id, name'),
      // Get team memberships  
      supabase.from('team_members').select('team_id, user_id'),
      // Get staff data
      supabase.from('profiles')
        .select('id, username, role')
        .in('role', ['worker', 'manager']),
      // Get staff skills
      supabase.from('user_skills')
        .select('user_id, skills!inner(name)')
    ])

    if (teamsData.error) throw teamsData.error
    if (teamMembershipsData.error) throw teamMembershipsData.error  
    if (staffData.error) throw staffData.error
    if (staffSkillsData.error) throw staffSkillsData.error

    // Create skills lookup map
    const skillsByUser = new Map()
    staffSkillsData.data?.forEach(skill => {
      if (!skillsByUser.has(skill.user_id)) {
        skillsByUser.set(skill.user_id, [])
      }
      skillsByUser.get(skill.user_id).push(skill.skills.name)
    })

    // Create efficient lookup maps
    const staffMap = new Map<string, StaffMember>(staffData.data.map(s => [s.id, s]))
    const teamsMap = new Map<string, Team>(teamsData.data.map(t => [t.id, t]))
    const teamMembershipsByTeam = new Map()
    const teamMembershipsByUser = new Map()
    
    teamMembershipsData.data.forEach(tm => {
      // Group by team
      if (!teamMembershipsByTeam.has(tm.team_id)) {
        teamMembershipsByTeam.set(tm.team_id, [])
      }
      teamMembershipsByTeam.get(tm.team_id).push(tm.user_id)
      
      // Group by user
      if (!teamMembershipsByUser.has(tm.user_id)) {
        teamMembershipsByUser.set(tm.user_id, [])
      }
      teamMembershipsByUser.get(tm.user_id).push(tm.team_id)
    })

    // Prepare prompt with context
    const prompt = {
      role: "system",
      content: `Process tickets in this order:

1. ALWAYS assign to a team member (required):
   - First try matching skills (any role)
   - Then try managers in relevant teams
   - Finally any available manager
   - Never skip assignment

2. ANALYZE SIMILAR TICKETS:
   - Review past tickets in the list
   - Study their solutions and outcomes
   - Note common patterns in successful resolutions
   - Use these insights for internal context
   - Never reference similar tickets in public comments

3. Then try auto-resolve ONLY if:
   - A PUBLISHED KB article (Status: published) fully solves issue, OR
   - You can write a complete solution in a public comment
   - Never reference tickets in public comments
   
4. Add comments based on these strict rules:
   - Public comments:
     * ONLY reference articles where Status: published
     * NEVER reference articles where Status: draft
     * Keep focused on direct solutions
     * Never mention other tickets
     * Double check article.Status before referencing
   - Internal comments only:
     * ALWAYS add internal comment if similar tickets found
     * Note resolution patterns and insights
     * Can reference draft articles
     * Can reference similar tickets
     * Use for staff context/patterns
   - Keep all comments concise
   - When referencing articles:
     * VALIDATION REQUIRED: Check article.Status === 'published'
     * If article.Status !== 'published', DO NOT reference it in public comments
     * Explain relevance to current issue
     * Adapt solutions to customer context
   - When referencing tickets:
     * ONLY in internal comments
     * Focus on solution patterns
     * Never expose customer details
     * No customer-to-ticket linking

CRITICAL VALIDATION:
- Before adding any article reference to a public comment:
  1. Find the article in the KB Articles list
  2. Check if Status: published (exact match required)
  3. If Status is not 'published', DO NOT reference the article
  4. If unsure about Status, DO NOT reference the article

SIMILAR TICKETS HANDLING:
- For each relevant ticket:
  1. Review resolution approach
  2. Note successful patterns
  3. Create internal comment with insights
  4. Focus on solution patterns
  5. Never expose in public comments

OTHER NOTES:
- don't reference IDs in actual comments
- try to use your own logical reasoning to solve the problem
- you can leave multiple comments, e.g. a public and internal comment

Return JSON array of these actions:
set_assignee: { 
  type: 'set_assignee',
  team_id: string (team UUID),
  staff_id: string (staff UUID)
}

set_status: {
  type: 'set_status',
  status: 'resolved' (only valid value)
}

add_comment: {
  type: 'add_comment',
  content: string (comment text),
  internal: boolean,
  references: Array of {
    type: 'article' | 'ticket',
    id: string (UUID)
  }
}

debug_log: {
  type: 'debug_log',
  message: string (explain choices)
}`
    }

    const userMessage = {
      role: "user", 
      content: `New Ticket:
Title: ${ticket.title}
Description: ${ticket.description}
Priority: ${ticket.priority}
Created by: ${ticket.created_by}
Tags: ${ticket.ticket_tag_links?.map((link: any) => link.ticket_tags.name).join(', ') || 'none'}
Custom Fields:
${ticket.ticket_field_values?.map((field: any) => `${field.ticket_field_definitions.name}: ${field.value}`).join('\n') || 'none'}

Relevant KB Articles:
${articles.length ? articles.map((a: any) => `ID: ${a.id}
Title: ${a.title}
Summary: ${a.summary || 'none'}
Status: ${Boolean(a.published) === true ? 'published' : 'draft'}
Version: ${a.version}
Created by: ${staffMap.get(a.created_by)?.username || 'unknown'}
Created at: ${new Date(a.created_at).toLocaleString()}
Updated at: ${new Date(a.updated_at).toLocaleString()}
Content: ${a.content}
Match: ${Math.round(a.similarity * 100)}%`).join('\n\n') : 'No relevant articles found'}

Similar Tickets:
${similarTickets.length ? similarTickets.map((t: any) => `ID: ${t.id}
Title: ${t.title}
Description: ${t.description}
Status: ${t.status}
Priority: ${t.priority}
Tags: ${t.ticket_tag_links?.map((link: any) => link.ticket_tags.name).join(', ') || 'none'}
Custom Fields:
${t.ticket_field_values?.map((field: any) => `${field.ticket_field_definitions.name}: ${field.value}`).join('\n') || 'none'}
Comments:
${t.ticket_comments?.filter((c: any) => !c.internal).map((c: any) => `- ${c.content}`).join('\n') || 'none'}
Match: ${Math.round(t.similarity * 100)}%`).join('\n\n') : 'No similar tickets found'}

Teams:
${teamsData.data.map((t: any) => {
  const memberIds = teamMembershipsByTeam.get(t.id) || []
  const teamMembers = memberIds
    .map(id => {
      const member = staffMap.get(id)
      return member ? `${member.username} (${member.role})` : null
    })
    .filter(Boolean)
  
  return `ID: ${t.id}
Name: ${t.name}
Members: ${teamMembers.join(', ')}`
}).join('\n\n')}

Staff:
${staffData.data.map((s: any) => {
  const teamIds = teamMembershipsByUser.get(s.id) || []
  const memberTeams = teamIds
    .map(id => teamsMap.get(id)?.name)
    .filter(Boolean)
  const skills = skillsByUser.get(s.id) || []
  
  return `ID: ${s.id}  # Use this full UUID when setting staff_id in set_assignee action
Username: ${s.username}
Role: ${s.role}
Teams: ${memberTeams.length ? memberTeams.join(', ') : 'none'}
Skills: ${skills.length ? skills.join(', ') : 'none'}`
}).join('\n\n')}`
    }

    // Get AI response
    console.log('Sending prompt to LLM:', JSON.stringify([prompt, userMessage], null, 2))
    
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

    // Log prompt and completion
    const generation = trace.generation({
      name: 'process-ticket',
      model: 'gpt-4o-mini',
      modelParameters: {
        temperature: 0,
        response_format: { type: "json_object" }
      },
      prompt: [prompt, userMessage],
      completion: completion.choices[0].message.content
    })
    generation.end()

    // Execute actions
    const execution = trace.span({
      name: 'execute-actions',
      input: response
    })

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
              internal: action.internal
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

    execution.end()
    await trace.update({ 
      status: 'success',
      output: {
        actions: response.actions,
        summary: {
          wasAutoResolved: response.actions.some(a => a.type === 'set_status' && a.status === 'resolved'),
          assignedTeam: response.actions.find(a => a.type === 'set_assignee')?.team_id,
          assignedStaff: response.actions.find(a => a.type === 'set_assignee')?.staff_id,
          numComments: response.actions.filter(a => a.type === 'add_comment').length,
          referencedArticles: response.actions
            .filter(a => a.type === 'add_comment')
            .flatMap(a => a.references || [])
            .filter(r => r.type === 'article')
            .map(r => r.id)
        },
        llmUsage: completion.usage
      }
    })
    try {
      await langfuse.flush()
      await langfuse.shutdownAsync()
    } catch (e) {
      console.error('Langfuse error:', e)
    }

    // Add debug logging
    console.log('Langfuse trace completed:', {
      traceId: `ticket-${ticket_id}`,
      publicKey: Deno.env.get('LANGFUSE_PUBLIC_KEY')?.slice(0,8) + '...',
      host: Deno.env.get('LANGFUSE_HOST'),
      timestamp: new Date().toISOString()
    })

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