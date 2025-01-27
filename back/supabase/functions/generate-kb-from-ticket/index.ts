import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { OpenAI } from "https://esm.sh/openai@4.24.1"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticket_id } = await req.json()
    if (!ticket_id) throw new Error('ticket_id is required')

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

    // Check if article already exists for this ticket
    const { data: existingLink } = await supabase
      .from('kb_article_tickets')
      .select('article_id')
      .eq('ticket_id', ticket_id)
      .single()

    if (existingLink) {
      return new Response(
        JSON.stringify({ error: 'Article already exists for this ticket' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }

    // Get ticket data with comments, feedback, tags, and custom fields
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_comments(content, internal, created_at, created_by),
        ticket_feedback(rating, comment),
        ticket_tag_links!left(ticket_tags(name)),
        ticket_field_values!left(value, ticket_field_definitions!inner(name))
      `)
      .eq('id', ticket_id)
      .single()

    if (ticketError) throw ticketError
    if (!ticket) throw new Error(`Ticket ${ticket_id} not found`)

    // Filter out internal comments
    const publicComments = ticket.ticket_comments
      .filter((c: any) => !c.internal)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Format ticket data for prompt
    const ticketData = {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      tags: ticket.ticket_tag_links?.map((t: any) => t.ticket_tags.name) ?? [],
      customFields: ticket.ticket_field_values?.map((f: any) => ({
        name: f.ticket_field_definitions.name,
        value: f.value
      })) ?? [],
      comments: publicComments.map((c: any) => ({
        content: c.content,
        created_at: c.created_at,
        author_type: c.created_by === ticket.created_by ? 'customer' : (c.created_by ? 'worker' : 'ai')
      })),
      feedback: ticket.ticket_feedback?.[0] ?? null
    }

    const prompt = `Create a knowledge base article from this resolved ticket:

Title: ${ticketData.title}
Description: ${ticketData.description}
Priority: ${ticketData.priority}
Tags: ${ticketData.tags.join(', ') || 'none'}

Custom Fields:
${ticketData.customFields.map(f => `${f.name}: ${f.value}`).join('\n')}

Resolution Thread:
${ticketData.comments.map(c => `[${new Date(c.created_at).toLocaleString()}] ${c.author_type}:\n${c.content}`).join('\n\n')}

${ticketData.feedback ? `Customer Feedback:
Rating: ${ticketData.feedback.rating}/5
Comment: ${ticketData.feedback.comment || 'none'}` : ''}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are writing knowledge base articles to help customers solve their issues. 
Convert this resolved support ticket into a clear, helpful article.
Focus on the customer's description of the problem and the worker's solution.
Do not mention tickets, support context, or that this was generated from a support interaction.
Only include information that was explicitly provided - do not add speculative advice or context.
Respond in JSON format with these fields:
{
  "title": "clear title without any prefix",
  "summary": "brief overview",
  "content": "full article in markdown"
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    })

    const response = JSON.parse(completion.choices[0].message.content)
    if (!response?.title || !response?.content) throw new Error('Failed to generate article content')

    // Create article using upsert-article endpoint
    const { data, error: articleError } = await supabase.functions.invoke('upsert-article', {
      body: {
        title: response.title,
        content: response.content,
        summary: response.summary,
        published: true // Auto-publish all AI-generated articles
      },
      headers: {
        'peer_key': Deno.env.get('PLATFORM_KEY')
      }
    })

    if (articleError) throw articleError
    if (!data?.article?.id) throw new Error('Failed to create article')

    // Link article to ticket
    const { error: linkError } = await supabase
      .from('kb_article_tickets')
      .insert({
        article_id: data.article.id,
        ticket_id
      })

    if (linkError) throw linkError

    return new Response(
      JSON.stringify({ article: data.article }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
}) 