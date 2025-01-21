import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { CustomField } from './useCustomFields'

interface TeamFieldDefinition {
  team_id: string
  field_id: string
}

export function useFieldDefinitions(teamId?: string) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [teamFields, setTeamFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAllFields()
    if (teamId) {
      loadTeamFields()
    }
  }, [teamId])

  async function loadAllFields() {
    try {
      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .select('*')
        .order('name')

      if (error) throw error
      setFields(data)
    } catch (err) {
      console.error('Error loading fields:', err)
      setError('failed to load fields')
    }
  }

  async function loadTeamFields() {
    if (!teamId) return

    try {
      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .select(`
          *,
          team_field_definitions!inner(team_id)
        `)
        .eq('team_field_definitions.team_id', teamId)
        .order('name')

      if (error) throw error
      setTeamFields(data)
    } catch (err) {
      console.error('Error loading team fields:', err)
      setError('failed to load team fields')
    }
  }

  async function createField(name: string, type: CustomField['type'], required: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('not authenticated')

      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .insert({
          name,
          type,
          required,
          owner_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      setFields(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Error creating field:', err)
      setError('failed to create field')
      return null
    }
  }

  async function updateField(fieldId: string, updates: Partial<CustomField>) {
    try {
      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .update(updates)
        .eq('id', fieldId)
        .select()
        .single()

      if (error) throw error
      setFields(prev => prev.map(f => f.id === fieldId ? data : f))
      return data
    } catch (err) {
      console.error('Error updating field:', err)
      setError('failed to update field')
      return null
    }
  }

  async function addFieldToTeam(fieldId: string) {
    if (!teamId) return false

    try {
      const { error } = await supabase
        .from('team_field_definitions')
        .insert({
          team_id: teamId,
          field_id: fieldId
        })

      if (error) throw error
      await loadTeamFields()
      return true
    } catch (err) {
      console.error('Error adding field to team:', err)
      setError('failed to add field to team')
      return false
    }
  }

  async function removeFieldFromTeam(fieldId: string) {
    if (!teamId) return false

    try {
      const { error } = await supabase
        .from('team_field_definitions')
        .delete()
        .eq('team_id', teamId)
        .eq('field_id', fieldId)

      if (error) throw error
      await loadTeamFields()
      return true
    } catch (err) {
      console.error('Error removing field from team:', err)
      setError('failed to remove field from team')
      return false
    }
  }

  async function transferOwnership(fieldId: string, newOwnerId: string) {
    try {
      const { data, error } = await supabase
        .from('ticket_field_definitions')
        .update({ owner_id: newOwnerId })
        .eq('id', fieldId)
        .select()
        .single()

      if (error) throw error
      setFields(prev => prev.map(f => f.id === fieldId ? data : f))
      return true
    } catch (err) {
      console.error('Error transferring ownership:', err)
      setError('failed to transfer ownership')
      return false
    }
  }

  async function deleteField(fieldId: string) {
    try {
      const { error } = await supabase
        .from('ticket_field_definitions')
        .delete()
        .eq('id', fieldId)

      if (error) throw error
      setFields(prev => prev.filter(f => f.id !== fieldId))
      setTeamFields(prev => prev.filter(f => f.id !== fieldId))
      return true
    } catch (err) {
      console.error('Error deleting field:', err)
      setError('failed to delete field')
      return false
    }
  }

  return {
    fields,
    teamFields,
    loading,
    error,
    createField,
    updateField,
    addFieldToTeam,
    removeFieldFromTeam,
    transferOwnership,
    deleteField
  }
} 