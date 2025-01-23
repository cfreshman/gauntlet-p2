import { formatTextWithLinks } from '../../lib/utils'

interface FormattedTextProps {
  text: string
  className?: string
}

interface LinkPart {
  type: 'link'
  url: string
  display: string
}

type TextPart = string | LinkPart

export function FormattedText({ text, className = '' }: FormattedTextProps) {
  const parts = formatTextWithLinks(text)
  
  return (
    <div className={`whitespace-pre-wrap break-words w-full ${className}`}>
      {parts.map((part: TextPart, i: number) => {
        if (typeof part === 'string') {
          return part
        }
        return (
          <a
            key={i}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part.display}
          </a>
        )
      })}
    </div>
  )
} 