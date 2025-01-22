import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "../../lib/hooks/useSupabase";
import ReactMarkdown from "react-markdown";
import '../../styles/github-markdown.css';

interface ArticleViewerProps {
  id: string;
}

export function ArticleViewer({ id }: ArticleViewerProps) {
  const supabase = useSupabase();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadContent = useCallback(async () => {
    try {
      const { data: article, error: articleError } = await supabase
        .from("kb_articles")
        .select("storage_path")
        .eq("id", id)
        .single();

      if (articleError) throw articleError;
      if (!article?.storage_path) {
        setError("article not found");
        return;
      }

      const { data, error: storageError } = await supabase.storage
        .from("kb")
        .download(article.storage_path);

      if (storageError) throw storageError;

      const text = await data.text();
      setContent(text);
    } catch (error) {
      console.error("error loading article content:", error);
      setError("failed to load article content");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-primary/70 min-h-[300px]">
        loading article...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-500 min-h-[300px]">
        {error}
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center text-primary/70 min-h-[300px]">
        no content available
      </div>
    );
  }

  return (
    <article className="markdown-body">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
} 