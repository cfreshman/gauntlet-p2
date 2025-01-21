import { useState } from 'react'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useAuth } from '../../lib/hooks/useAuth'

type FieldType = 'text' | 'number' | 'boolean' | 'date'

interface CustomFieldManagerProps {
  teamId?: string
}

export function CustomFieldManager({ teamId }: CustomFieldManagerProps) {
  const { profile } = useAuth()
  const {
    fields,
    teamFields,
    error,
    createField,
    addFieldToTeam,
    removeFieldFromTeam,
    deleteField
  } = useFieldDefinitions(teamId || undefined)

  const [newField, setNewField] = useState<{
    name: string
    type: FieldType
    required: boolean
  }>({
    name: '',
    type: 'text',
    required: false
  })

  if (!profile || profile.role !== 'manager') {
    return null
  }

  async function handleCreateField() {
    if (!newField.name) return

    const field = await createField(
      newField.name,
      newField.type,
      newField.required
    )

    if (field && teamId) {
      await addFieldToTeam(field.id)
    }

    setNewField({
      name: '',
      type: 'text',
      required: false
    })
  }

  async function handleToggleTeamField(fieldId: string, isTeamField: boolean) {
    if (isTeamField) {
      await removeFieldFromTeam(fieldId)
    } else {
      await addFieldToTeam(fieldId)
    }
  }

  async function handleDeleteField(fieldId: string) {
    await deleteField(fieldId)
  }

  const teamFieldIds = new Set(teamFields.map(f => f.id))

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">custom fields</h3>
        
        {/* Create new field */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>name</Label>
            <Input
              value={newField.name}
              onChange={e => setNewField(prev => ({ ...prev, name: e.target.value }))}
              placeholder="field name"
            />
          </div>
          <div>
            <Label>type</Label>
            <Select
              value={newField.type}
              onValueChange={(value: FieldType) => setNewField(prev => ({ 
                ...prev, 
                type: value
              }))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">text</SelectItem>
                <SelectItem value="number">number</SelectItem>
                <SelectItem value="boolean">boolean</SelectItem>
                <SelectItem value="date">date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={newField.required}
              onCheckedChange={(checked: boolean) => setNewField(prev => ({ ...prev, required: checked }))}
            />
            <Label>required</Label>
          </div>
          <Button onClick={handleCreateField} size="sm">
            create field
          </Button>
        </div>

        {/* List existing fields */}
        <div className="space-y-2">
          {fields.map(field => (
            <div key={field.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <span className="font-medium">{field.name}</span>
                <span className="ml-2 text-sm text-gray-500">({field.type})</span>
                {field.required && (
                  <span className="ml-2 text-sm text-gray-500">required</span>
                )}
              </div>
              
              {teamId && (
                <Switch
                  checked={teamFieldIds.has(field.id)}
                  onCheckedChange={() => handleToggleTeamField(field.id, teamFieldIds.has(field.id))}
                />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteField(field.id)}
              >
                delete
              </Button>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
} 