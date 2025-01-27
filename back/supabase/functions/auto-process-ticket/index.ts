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

    // Search KB articles
    const { data: kbResults, error: kbError } = await supabase.functions.invoke('search-kb', {
      body: { query: `${ticket.title}\n${ticket.description}` }
    })
    if (kbError) throw kbError

    // Get full article content for each result in parallel
    const articles = await Promise.all(
      kbResults.articles.map(async (article) => {
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

2. Then try auto-resolve if:
   - Published KB article (not draft) fully solves issue
   
3. Always add brief comments for relevant articles:
   - Public comments: only reference relevant published KB articles
   - Internal comments: only reference relevant draft articles
   - Keep comments short and focused
   
4. Skip silently if no articles found

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
    type: 'article',
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