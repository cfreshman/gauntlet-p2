import { useEffect, useState } from "react";
import { useSupabase } from "../../lib/hooks/useSupabase";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { useUsernames } from "../../lib/hooks/useUsernames";

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  published: boolean;
  created_at: string;
  created_by: string;
  version: number;
}

export function ArticleList() {
  const supabase = useSupabase();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { usernames, fetchUsername } = useUsernames();

  useEffect(() => {
    loadArticles();
  }, []);

  // Load usernames when articles change
  useEffect(() => {
    articles.forEach(article => {
      if (article.created_by) {
        fetchUsername(article.created_by);
      }
    });
  }, [articles]);

  async function loadArticles() {
    try {
      // The RLS policy will automatically filter based on user role
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("error loading articles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("kb_articles").delete().eq("id", id);
      if (error) throw error;
      await loadArticles();
    } catch (error) {
      console.error("error deleting article:", error);
    }
  }

  if (loading) {
    return <div className="flex h-32 items-center justify-center text-primary/70">loading articles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-primary">articles</h2>
        <Button size="sm" variant="outline" asChild>
          <Link to="/kb/new">new article</Link>
        </Button>
      </div>

      <div className="bg-background border border-primary shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-primary/20">
          {articles.map((article) => (
            <div
              key={article.id}
              className="hover:bg-primary/5 p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-medium text-primary hover:text-primary/90 mb-1">{article.title}</h3>
                {article.summary && (
                  <p className="text-sm text-primary/70">{article.summary}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-primary/50">
                  <span>v{article.version}</span>
                  <span>•</span>
                  <span>by {usernames[article.created_by] || 'unknown'}</span>
                  <span>•</span>
                  <span>
                    {new Date(article.created_at).toLocaleDateString()}
                  </span>
                  {article.published && (
                    <>
                      <span>•</span>
                      <span className="text-green-500">published</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/help/${article.id}`}>view</Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/kb/${article.id}/edit`}>edit</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleDelete(article.id)}
                >
                  delete
                </Button>
              </div>
            </div>
          ))}

          {articles.length === 0 && (
            <div className="flex h-[100px] items-center justify-center text-sm text-primary/70">
              no articles yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 