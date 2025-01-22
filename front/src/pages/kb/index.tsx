import { useState } from "react";
import { ArticleList } from "../../components/kb/ArticleList";
import { ArticleEditor } from "../../components/kb/ArticleEditor";

interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  published: boolean;
}

export default function KnowledgeBase() {
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  function handleEdit(article: Article) {
    setSelectedArticle(article);
    setMode("edit");
  }

  function handleCreate() {
    setSelectedArticle(null);
    setMode("edit");
  }

  function handleSave() {
    setSelectedArticle(null);
    setMode("list");
  }

  function handleCancel() {
    setSelectedArticle(null);
    setMode("list");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">knowledge base</h1>

      {mode === "list" ? (
        <ArticleList
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      ) : (
        <ArticleEditor
          id={selectedArticle?.id}
          initialTitle={selectedArticle?.title}
          initialContent={selectedArticle?.content}
          initialSummary={selectedArticle?.summary}
          initialPublished={selectedArticle?.published}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
} 