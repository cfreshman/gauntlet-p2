import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'date'
  required: boolean
  owner_id?: string | null
}

interface SupabaseFieldValue {
  field_id: string
  value: string
  created_at: string
  ticket_field_definitions: {
    id: string
    name: string
    type: 'text' | 'number' | 'boolean' | 'date'
    required: boolean
  }
}

export function useCustomFields(ticketId?: string) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ticketId) {
      loadFields()
    }
  }, [ticketId])

  async function loadFields() {
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      // Check if this is a template
      const { error: ticketError } = await supabase
        .from('tickets')
        .select('title')
        .eq('id', ticketId)
        .single()

      if (ticketError) throw ticketError

      // Get fields that have values for this ticket
      const { data: fieldValues, error: valuesError } = await supabase
        .from('ticket_field_values')
        .select(`
          field_id,
          value,
          created_at,
          ticket_field_definitions (
            id,
            name,
            type,
            required
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (valuesError) throw valuesError

      // Transform the data
      const valueMap: Record<string, string> = {}
      const fieldsMap = new Map<string, CustomField>()
   
      ;(fieldValues as unknown as SupabaseFieldValue[])?.forEach(fv => {
        if (fv.ticket_field_definitions) {
          // Always copy field definitions
          fieldsMap.set(fv.field_id, {
            id: fv.field_id,
            name: fv.ticket_field_definitions.name,
            type: fv.ticket_field_definitions.type,
            required: fv.ticket_field_definitions.required
          })
          
          // Always copy values
          valueMap[fv.field_id] = fv.value
        }
      })

      setValues(valueMap)
      // Convert map to array in the same order as the query results
      setFields(Array.from(fieldsMap.values()))

    } catch (e) {
      console.error('Error loading fields:', e)
      setError('failed to load fields')
    } finally {
      setLoading(false)
    }
  }

  function updateValue(fieldId: string, value: string) {
    setValues(prev => ({
      ...prev,
      [fieldId]: value
    }))

    // Clear error when value changes
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  function validateFields() {
    const errors: Record<string, string> = {}
    let isValid = true

    fields.forEach(field => {
      if (field.required) {
        const value = values[field.id]
        if (!value || value.trim() === '') {
          errors[field.id] = 'This field is required'
          isValid = false
        }
      }

      if (field.type === 'number' && values[field.id]) {
        const num = Number(values[field.id])
        if (isNaN(num)) {
          errors[field.id] = 'Must be a valid number'
          isValid = false
        }
      }
    })

    setFieldErrors(errors)
    return isValid
  }

  return {
    fields,
    values,
    fieldErrors,
    loading,
    error,
    updateValue,
    validateFields,
    loadFields
  }
} 