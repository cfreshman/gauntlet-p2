import { useState } from 'react'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Card, CardContent } from '../ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useAuth } from '../../lib/hooks/useAuth'
import { CustomFieldType } from './CustomField'

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
  } = useFieldDefinitions(teamId || undefined)

  const [newField, setNewField] = useState<Omit<CustomFieldType, 'id'>>({
    name: '',
    type: 'text',
    required: false,
    owner_id: null
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
      required: false,
      owner_id: null
    })
  }

  async function handleToggleTeamField(fieldId: string, isTeamField: boolean) {
    if (isTeamField) {
      await removeFieldFromTeam(fieldId)
    } else {
      await addFieldToTeam(fieldId)
    }
  }

  const teamFieldIds = new Set(teamFields.map(f => f.id))

  return (
    <Card>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-primary">custom fields</h3>
          
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
                onValueChange={(value: CustomFieldType['type']) => setNewField(prev => ({ 
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
              <div 
                key={field.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-background hover:bg-primary/5"
              >
                <div>
                  <span className="font-medium text-primary">{field.name}</span>
                  <span className="ml-2 text-sm text-primary/70">({field.type})</span>
                  {field.required && (
                    <span className="ml-2 text-sm text-primary/70">required</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {teamId && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={teamFieldIds.has(field.id)}
                        onCheckedChange={() => handleToggleTeamField(field.id, teamFieldIds.has(field.id))}
                      />
                      <span className="text-sm text-primary/70">team field</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 