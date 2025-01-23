import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { CustomFields } from './CustomFields'
import { useCustomFields } from '../../lib/hooks/useCustomFields'
import { Textarea } from '../ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select'
import { Label } from '../../components/ui/label'

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

interface TemplateData {
  title: string
  description: string
  priority: TicketPriority
  ticket_tag_links?: Array<{
    tag: {
      id: string
      name: string
    }
  }>
}

export function TicketCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const { user } = useAuth()
  const { fields, values, updateValue, validateFields, fieldErrors } = useCustomFields(templateId || undefined)
  const [template, setTemplate] = useState<TemplateData | null>(null)

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  useEffect(() => {
    if (template?.priority) {
      setPriority(template.priority)
    }
  }, [template])

  async function loadTemplate() {
    try {
      const { data, error } = await supabase.functions.invoke('get-template', {
        body: { id: templateId }
      })

      if (error) throw error
      if (data) {
        // Remove template: prefix from title when using as template
        setTemplate({
          title: data.title.slice(9).trim(),
          description: data.description || '',
          priority: data.priority || 'medium',
          ticket_tag_links: data.ticket_tag_links
        })
      }
    } catch (e) {
      console.error('Error loading template:', e)
      setError('failed to load template')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return // Early return if no user
    
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority,
      created_by: user.id,
      field_values: values,
      tags: template?.ticket_tag_links?.map(link => link.tag.id) || []
    }

    // Validate required fields
    if (!validateFields()) {
      setError('please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const { data: response, error } = await supabase.functions.invoke('create-ticket', {
        body: data
      })

      if (error) {
        console.error('Error creating ticket:', error)
        throw error
      }

      if (!response?.ticket) {
        throw new Error('no ticket returned')
      }

      navigate('/tickets')
    } catch (e) {
      console.error('Error creating ticket:', e)
      setError('failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">create ticket</h1>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label htmlFor="title" className="block text-sm mb-1">
            title
          </label>
          <Input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={template?.title}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm mb-1">
            description
          </label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={template?.description}
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm mb-1">
            priority
          </label>
          <Select
            name="priority"
            value={priority}
            onValueChange={(value) => setPriority(value as TicketPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">low</SelectItem>
              <SelectItem value="medium">medium</SelectItem>
              <SelectItem value="high">high</SelectItem>
              <SelectItem value="urgent">urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {template?.ticket_tag_links && template.ticket_tag_links.length > 0 && (
          <div>
            <label className="block text-sm mb-1">
              tags
            </label>
            <div className="flex flex-wrap gap-2">
              {template.ticket_tag_links.map(link => (
                <div 
                  key={link.tag.id}
                  className="px-2 py-1 border border-primary/20 rounded-full text-sm text-primary/70"
                >
                  {link.tag.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {fields && fields.length > 0 && (
          <div>
            <Label className="text-sm text-primary/70">additional fields</Label>
            <div className="mt-2">
              <CustomFields
                fields={fields}
                values={values}
                onChange={updateValue}
                errors={fieldErrors}
                className="space-y-4"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <Button 
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'creating...' : 'create ticket'}
        </Button>
      </form>
    </div>
  )
}