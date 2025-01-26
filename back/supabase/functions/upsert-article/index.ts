import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface UpsertArticleBody {
  id?: string;
  title: string;
  content: string;
  summary?: string;
  published?: boolean;
  takeOwnership?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('PLATFORM_URL') ?? '',
      Deno.env.get('PLATFORM_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get("Authorization")?.split(" ")[1] ?? "";
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["worker", "manager"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get request body
    const body = (await req.json()) as UpsertArticleBody;

    // Validate input
    if (!body.title || !body.content) {
      return new Response(
        JSON.stringify({ error: "title and content are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only managers can publish
    if (body.published && profile.role !== "manager") {
      return new Response(
        JSON.stringify({ error: "only managers can publish articles" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If updating, verify ownership or manager role
    let version = 1;
    if (body.id) {
      const { data: existing } = await supabase
        .from("kb_articles")
        .select("created_by, version")
        .eq("id", body.id)
        .single();

      if (existing) {
        // Allow edit if:
        // 1. User is a manager
        // 2. User is taking ownership
        // 3. User owns the article
        if (profile.role !== "manager" && !body.takeOwnership && existing.created_by !== user.id) {
          return new Response(
            JSON.stringify({ error: "can only edit your own articles" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        version = existing.version + 1;
      }
    }

    // Generate storage path
    const articleId = body.id || crypto.randomUUID();
    const storagePath = `${articleId}.md`;

    // Upload content to storage
    const { error: uploadError } = await supabase.storage
      .from("kb")
      .upload(storagePath, body.content, {
        contentType: "text/markdown",
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "failed to upload content" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update or insert article record
    const { data: article, error: articleError } = await supabase
      .from("kb_articles")
      .upsert(
        {
          id: articleId,
          title: body.title,
          summary: body.summary,
          storage_path: storagePath,
          published: body.published ?? false,
          version: version ?? 1,
          created_by: body.id ? (body.takeOwnership ? user.id : undefined) : user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (articleError) {
      return new Response(
        JSON.stringify({ error: "failed to update article record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update article embedding
    try {
      const { error: embedError } = await supabase.functions.invoke('update-kb-embedding', {
        body: { 
          article_id: articleId,
          title: body.title,
          content: body.content
        }
      });

      if (embedError) {
        console.error('Failed to update embedding:', embedError);
      }
    } catch (embedError) {
      console.error('Error updating embedding:', embedError);
    }

    return new Response(JSON.stringify({ article }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 