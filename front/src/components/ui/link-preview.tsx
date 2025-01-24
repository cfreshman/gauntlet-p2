import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface TicketPreview {
  id: string
  title: string
}

interface ArticlePreview {
  id: string
  title: string
}

interface LinkPreviewProps {
  url: string
  className?: string
}

export function LinkPreview({ url, className = '' }: LinkPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<TicketPreview | null>(null)
  const [article, setArticle] = useState<ArticlePreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPreview() {
      try {
        // Extract ID from URL
        const urlObj = new URL(url)
        const path = urlObj.pathname
        
        if (path.startsWith('/tickets/')) {
          const ticketId = path.split('/')[2]
          const { data, error } = await supabase
            .from('tickets')
            .select('id, title')
            .eq('id', ticketId)
            .single()

          if (error) throw error
          setTicket(data)
        } 
        else if (path.startsWith('/help/') || path.startsWith('/kb/')) {
          const articleId = path.split('/')[2]
          const { data, error } = await supabase
            .from('kb_articles')
            .select('id, title')
            .eq('id', articleId)
            .single()

          if (error) throw error
          setArticle(data)
        }
      } catch (e) {
        console.error('Error loading preview:', e)
        setError('failed to load preview')
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [url])

  const baseClasses = "inline-block px-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors cursor-pointer"

  if (loading) {
    return <span className={`${baseClasses} opacity-50 ${className}`}>loading...</span>
  }

  if (error) {
    return <a href={url} className={`${baseClasses} ${className}`}>{url}</a>
  }

  if (ticket) {
    return (
      <a href={url} className={`${baseClasses} ${className}`}>
        <span className="opacity-80">ticket:</span>
        <span className="ml-1 font-medium">{ticket.title}</span>
      </a>
    )
  }

  if (article) {
    return (
      <a href={url} className={`${baseClasses} ${className}`}>
        <span className="opacity-80">article:</span>
        <span className="ml-1 font-medium">{article.title}</span>
      </a>
    )
  }

  return <a href={url} className={`${baseClasses} ${className}`}>{url}</a>
} 