import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSupabase } from "../../lib/hooks/useSupabase";
import { ArticleViewer } from "../../components/kb/ArticleViewer";
import { Button } from "../../components/ui/button";
import { useUsernames } from "../../lib/hooks/useUsernames";

interface Article {
  id: string;
  title: string;
  summary?: string;
  created_at: string;
  created_by: string;
}

export default function Help() {
  const navigate = useNavigate();
  const { id } = useParams();
  const supabase = useSupabase();
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { usernames, fetchUsername } = useUsernames();

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    if (id) {
      loadArticle(id);
    } else {
      setCurrentArticle(null);
    }
  }, [id]);

  // Load usernames when articles or current article changes
  useEffect(() => {
    articles.forEach(article => {
      if (article.created_by) {
        fetchUsername(article.created_by);
      }
    });
    if (currentArticle?.created_by) {
      fetchUsername(currentArticle.created_by);
    }
  }, [articles, currentArticle, fetchUsername]);

  async function loadArticle(articleId: string) {
    try {
      const { data, error } = await supabase
        .from("kb_articles")
        .select("id, title, summary, created_at, created_by")
        .eq("id", articleId)
        .eq("published", true)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentArticle(data);
      }
    } catch (error) {
      console.error("error loading article:", error);
      setError('failed to load article');
      navigate("/help");
    }
  }

  async function loadArticles() {
    try {
      const { data, error } = await supabase
        .from("kb_articles")
        .select("id, title, summary, created_at, created_by")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("error loading articles:", error);
      setError('failed to load articles');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex h-32 items-center justify-center text-primary/70">
          loading articles...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex h-32 items-center justify-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">help center</h1>
        {!id && <span className="text-sm text-primary/70">{articles.length} articles</span>}
      </div>
      
      {id && currentArticle ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium text-primary mb-1">
                {currentArticle.title}
              </h2>
              {currentArticle.summary && (
                <p className="text-sm text-primary/70 mb-2">{currentArticle.summary}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-primary/50">
                <span>by {usernames[currentArticle.created_by] || 'unknown'}</span>
                <span>•</span>
                <span>{new Date(currentArticle.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/help")}
            >
              back to articles
            </Button>
          </div>
          <div className="bg-background border border-primary shadow rounded-lg overflow-hidden p-6">
            <ArticleViewer id={currentArticle.id} />
          </div>
        </div>
      ) : (
        <div className="bg-background border border-primary shadow rounded-lg overflow-hidden">
          <div className="divide-y divide-primary/20">
            {articles.length > 0 ? articles.map((article) => (
              <Link
                key={article.id}
                to={`/help/${article.id}`}
                className="block hover:bg-primary/5 p-4"
              >
                <h3 className="text-lg font-medium text-primary hover:text-primary/90 mb-1">{article.title}</h3>
                {article.summary && (
                  <p className="text-sm text-primary/70 mb-2">{article.summary}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-primary/50">
                  <span>by {usernames[article.created_by] || 'unknown'}</span>
                  <span>•</span>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            )) : (
              <div className="flex h-[100px] items-center justify-center text-sm text-primary/70">
                no published articles yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 