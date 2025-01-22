import { useState, ChangeEvent, useEffect } from "react";
import { useSupabase } from "../../lib/hooks/useSupabase";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useAuth } from "../../lib/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import '../../styles/github-markdown.css';

interface ArticleEditorProps {
  id?: string;
  initialTitle?: string;
  initialContent?: string;
  initialSummary?: string;
  initialPublished?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

const markdownHints = `# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*

- bullet point
- another point

1. numbered list
2. second item

[link text](url)

\`inline code\`

\`\`\`
code block
\`\`\`

> blockquote`;

const markdownExamples = `# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*

- bullet point
- another point

1. numbered list
2. second item

[link text](url)

\`inline code\`

\`\`\`
code block
\`\`\`

> blockquote`;

export function ArticleEditor({
  id,
  initialTitle = "",
  initialContent = "",
  initialSummary = "",
  initialPublished = false,
  onSave,
  onCancel,
}: ArticleEditorProps) {
  const supabase = useSupabase();
  const { profile } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [summary, setSummary] = useState(initialSummary);
  const [published, setPublished] = useState(initialPublished);
  const [takeOwnership, setTakeOwnership] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [showHints, setShowHints] = useState(false);

  // Load content from storage when editing
  useEffect(() => {
    if (!id) return;

    async function loadContent() {
      try {
        const { data: article } = await supabase
          .from('kb_articles')
          .select('storage_path')
          .eq('id', id)
          .single();

        if (article?.storage_path) {
          const { data, error } = await supabase.storage
            .from('kb')
            .download(article.storage_path);
            
          if (error) throw error;
          
          const text = await data.text();
          setContent(text);
        }
      } catch (error) {
        console.error('Error loading article content:', error);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [id, supabase]);

  async function handleSave() {
    if (!title || !content) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("upsert-article", {
        body: {
          id,
          title,
          content,
          summary,
          published: profile?.role === 'manager' ? published : false,
          takeOwnership,
        },
      });

      if (error) throw error;
      onSave?.();
    } catch (error) {
      console.error("error saving article:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center text-primary/70">
        loading article...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-primary">
          {id ? "edit article" : "new article"}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
          >
            cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!title || !content || saving}
          >
            {saving ? "saving..." : "save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="article title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">summary</Label>
          <Input
            id="summary"
            value={summary}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSummary(e.target.value)}
            placeholder="brief summary (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">content (markdown)</Label>
          <Tabs defaultValue="write" className="w-full">
            <TabsList>
              <TabsTrigger value="write">write</TabsTrigger>
              <TabsTrigger value="preview">preview</TabsTrigger>
            </TabsList>
            <TabsContent value="write" className="mt-0 space-y-4">
              <Textarea
                id="content"
                value={content}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                placeholder="article content in markdown"
                className="min-h-[300px] font-mono w-full"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHints(!showHints)}
                >
                  {showHints ? "hide syntax guide" : "show syntax guide"}
                </Button>
              </div>
              {showHints && (
                <div className="grid grid-cols-2 gap-4 border border-primary/20 rounded-md">
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-2">Markdown Syntax</h3>
                    <pre className="text-primary/70 whitespace-pre-wrap">{markdownHints}</pre>
                  </div>
                  <div className="border-l border-primary/20 p-4">
                    <h3 className="text-sm font-medium mb-2">Rendered Result</h3>
                    <div className="markdown-body bg-background text-sm">
                      <ReactMarkdown>{markdownExamples}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <div className="min-h-[300px] markdown-body bg-background border border-primary/20 rounded-md p-4">
                <ReactMarkdown>{content || "*No content yet*"}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {profile?.role === 'manager' && (
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label htmlFor="published">publish article</Label>
          </div>
        )}

        {id && (
          <div className="flex items-center space-x-2">
            <Switch
              id="takeOwnership"
              checked={takeOwnership}
              onCheckedChange={setTakeOwnership}
            />
            <Label htmlFor="takeOwnership">take ownership</Label>
          </div>
        )}
      </div>
    </div>
  );
} 