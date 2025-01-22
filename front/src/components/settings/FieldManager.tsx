import { useState } from 'react'
import { useFieldDefinitions } from '../../lib/hooks/useFieldDefinitions'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Switch } from '../../components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'

interface FieldManagerProps {
  teamId: string | null
}

export function FieldManager({ teamId }: FieldManagerProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'text' | 'number' | 'boolean' | 'date'>('text')
  const [required, setRequired] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const {
    fields,
    teamFields,
    loading,
    error: fieldsError,
    createField,
    addFieldToTeam,
    removeFieldFromTeam,
    deleteField
  } = useFieldDefinitions(teamId || undefined)

  if (!teamId) return null
  if (loading) return <div>loading fields...</div>
  if (fieldsError) return <div className="text-sm text-red-600">{fieldsError}</div>

  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const field = await createField(name, type, required)
    if (field) {
      await addFieldToTeam(field.id)
      setName('')
      setType('text')
      setRequired(false)
    }
  }

  const availableFields = fields.filter(
    field => !teamFields.some(tf => tf.id === field.id)
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">field definitions</h3>

      <form onSubmit={handleCreateField} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-primary/70">name</label>
          <Input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="enter field name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-primary/70">type</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {type}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setType('text')}>text</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setType('number')}>number</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setType('boolean')}>boolean</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setType('date')}>date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={required}
            onCheckedChange={setRequired}
          />
          <label className="text-sm text-primary/70">required</label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={!name}>
          create field
        </Button>
      </form>

      {teamFields.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">team fields</h4>
          {teamFields.map(field => (
            <div key={field.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{field.name}</div>
                <div className="text-sm text-primary/70">
                  {field.type} {field.required && '(required)'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFieldFromTeam(field.id)}
                >
                  remove
                </Button>
                {field.owner_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteField(field.id)}
                  >
                    delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {availableFields.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">available fields</h4>
          {availableFields.map(field => (
            <div key={field.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{field.name}</div>
                <div className="text-sm text-primary/70">
                  {field.type} {field.required && '(required)'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addFieldToTeam(field.id)}
                >
                  add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 