import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function createDebouncer() {
  const pendingOperations = new Map<string, NodeJS.Timeout>()

  return {
    debounce: (key: string, operation: () => void, delay: number = 500) => {
      // Clear any pending operation for this key
      const pending = pendingOperations.get(key)
      if (pending) {
        clearTimeout(pending)
      }
      
      // Schedule new operation
      pendingOperations.set(key, setTimeout(() => {
        operation()
        pendingOperations.delete(key)
      }, delay))
    },
    
    clear: (key: string) => {
      const pending = pendingOperations.get(key)
      if (pending) {
        clearTimeout(pending)
        pendingOperations.delete(key)
      }
    },

    clearAll: () => {
      pendingOperations.forEach(timeout => clearTimeout(timeout))
      pendingOperations.clear()
    }
  }
}

interface LinkPart {
  type: 'link' | 'internal-link'
  url: string
  display: string
}

type TextPart = string | LinkPart

export function formatTextWithLinks(text: string): TextPart[] {
  if (!text) return []
  
  // More precise regex that requires valid URL patterns and handles trailing punctuation
  const urlRegex = /\b(https?:\/\/)?(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(:\d+)?(\/[a-zA-Z0-9-._~:/?#[\]@!$&'*+,;=]*[a-zA-Z0-9-_~:/?#[\]@!$&'*+;=])?(?=[^a-zA-Z0-9-_~:/?#[\]@!$&'*+;=]|$)/gi
  
  // Split text into parts (URLs and non-URLs)
  const parts: TextPart[] = []
  let lastIndex = 0
  
  // Find all matches first
  const matches = Array.from(text.matchAll(urlRegex))
  
  // Process each match and the text between matches
  matches.forEach((match) => {
    const offset = match.index!
    
    // Add text before the URL
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset))
    }
    
    // Add the URL as a link object
    const matchText = match[0]
    // Remove any trailing punctuation that might have been included
    const cleanedUrl = matchText.replace(/[.,!?;:]+$/, '')
    const displayUrl = cleanedUrl.replace(/^https?:\/\//, '')
    const fullUrl = cleanedUrl.startsWith('http') ? cleanedUrl : `http://${cleanedUrl}`

    // Check if this is an internal link
    try {
      const url = new URL(fullUrl)
      const isInternalLink = (
        url.pathname.startsWith('/tickets/') ||
        url.pathname.startsWith('/help/') ||
        url.pathname.startsWith('/kb/')
      )
      parts.push({ 
        type: isInternalLink ? 'internal-link' : 'link', 
        url: fullUrl, 
        display: displayUrl 
      })
    } catch {
      parts.push({ type: 'link', url: fullUrl, display: displayUrl })
    }
    
    lastIndex = offset + matchText.length
  })
  
  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  
  return parts
} 
