import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSupabase } from "../../lib/hooks/useSupabase";
import { ArticleViewer } from "../../components/kb/ArticleViewer";
import { Button } from "../../components/ui/button";
import { useUsernames } from "../../lib/hooks/useUsernames";
import { useProfile } from "../../lib/hooks/useProfile";
import { Input } from "../../components/ui/input";
import { useDebounce } from "../../lib/hooks/useDebounce";

interface Article {
  id: string;
  title: string;
  summary?: string;
  created_at: string;
  created_by: string;
  similarity?: number;
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
  const { profile, loading: profileLoading } = useProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Only load articles after profile is loaded
  useEffect(() => {
    if (!profileLoading) {
      if (debouncedQuery) {
        searchArticles(debouncedQuery);
      } else {
        loadArticles();
      }
    }
  }, [profileLoading, debouncedQuery]);

  // Only load article after profile is loaded
  useEffect(() => {
    if (!profileLoading && id) {
      loadArticle(id);
    } else if (!id) {
      setCurrentArticle(null);
    }
  }, [id, profileLoading]);

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

  async function searchArticles(searchQuery: string) {
    try {
      setLoading(true);
      const { data: searchResults, error } = await supabase.functions.invoke<{ articles: Array<{ id: string; similarity: number }> }>('search-kb', {
        body: { query: searchQuery }
      });

      if (error) throw error;
      if (!searchResults?.articles) throw new Error('No results returned');

      // Get full article data for each result
      const articlesQuery = supabase
        .from('kb_articles')
        .select('id, title, summary, created_at, created_by')
        .in('id', searchResults.articles.map(a => a.id));

      // Only filter by published for non-staff
      if (!profile?.role || profile.role === 'customer') {
        articlesQuery.eq("published", true);
      }

      const { data: articles, error: articlesError } = await articlesQuery;

      if (articlesError) throw articlesError;
      if (!articles) throw new Error('No articles found');

      // Merge similarity scores with article data
      const articlesWithScores = articles.map(article => ({
        ...article,
        similarity: searchResults.articles.find(a => a.id === article.id)?.similarity
      }));

      setArticles(articlesWithScores);
    } catch (error) {
      console.error('error searching articles:', error);
      setError('failed to search articles');
    } finally {
      setLoading(false);
    }
  }

  async function loadArticle(articleId: string) {
    try {
      // Only filter by published for customers
      let query = supabase
        .from("kb_articles")
        .select("id, title, summary, created_at, created_by")
        .eq("id", articleId);

      // Only filter by published for non-staff
      if (!profile?.role || profile.role === 'customer') {
        query = query.eq("published", true);
      }

      const { data, error } = await query.single();

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
      // Only filter by published for customers
      let query = supabase
        .from("kb_articles")
        .select("id, title, summary, created_at, created_by")
        .order("created_at", { ascending: false });

      // Only filter by published for non-staff  
      if (!profile?.role || profile.role === 'customer') {
        query = query.eq("published", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("error loading articles:", error);
      setError('failed to load articles');
    } finally {
      setLoading(false);
    }
  }

  // Sort articles by similarity (if searching) or date (if not)
  const sortedArticles = [...articles].sort((a, b) => {
    if (searchQuery && a.similarity !== undefined && b.similarity !== undefined) {
      return b.similarity - a.similarity;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (profileLoading) {
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
        <div className="space-y-4">
          <div className="mb-4">
            <Input
              type="search"
              placeholder="search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="[&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>

          <div className="bg-background border border-primary shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-primary/20">
              {loading ? (
                <div className="flex h-[100px] items-center justify-center text-sm text-primary/70">
                  {searchQuery ? 'searching articles...' : 'loading articles...'}
                </div>
              ) : sortedArticles.length > 0 ? (
                sortedArticles.map((article) => (
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
                      {article.similarity !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-blue-500">{Math.round(article.similarity * 100)}% match</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex h-[100px] items-center justify-center text-sm text-primary/70">
                  {searchQuery ? 'no matching articles' : 'no published articles yet'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 