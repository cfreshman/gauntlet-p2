import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArticleList } from "../../components/kb/ArticleList";
import { ArticleEditor } from "../../components/kb/ArticleEditor";
import { useSupabase } from "../../lib/hooks/useSupabase";

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  published: boolean;
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pathname } = useLocation();
  const supabase = useSupabase();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  const isNew = pathname === '/kb/new';

  useEffect(() => {
    if (id && !isNew) {
      loadArticle(id);
    } else {
      setSelectedArticle(null);
    }
  }, [id, isNew]);

  async function loadArticle(articleId: string) {
    try {
      setLoading(true);

      // Get article metadata
      const { data: article, error: articleError } = await supabase
        .from("kb_articles")
        .select("id, title, summary, published")
        .eq("id", articleId)
        .single();

      if (articleError) throw articleError;

      // Get article content
      const { data, error: storageError } = await supabase.storage
        .from("kb")
        .download(`${articleId}.md`);

      if (storageError) throw storageError;

      const content = await data.text();

      setSelectedArticle({
        id: article.id,
        title: article.title,
        content,
        summary: article.summary,
        published: article.published
      });
    } catch (error) {
      console.error("error loading article:", error);
      navigate("/kb");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    navigate("/kb");
  }

  function handleCancel() {
    navigate("/kb");
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex h-32 items-center justify-center text-primary/70">
          loading article...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">knowledge base</h1>

      {id || isNew ? (
        <ArticleEditor
          id={selectedArticle?.id}
          initialTitle={selectedArticle?.title}
          initialContent={selectedArticle?.content}
          initialSummary={selectedArticle?.summary}
          initialPublished={selectedArticle?.published}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <ArticleList />
      )}
    </div>
  );
} 