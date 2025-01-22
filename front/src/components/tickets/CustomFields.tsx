import { Input } from '../../components/ui/input'
import { Switch } from '../../components/ui/switch'

interface CustomField {
  id: string
  name: string
  type: string
  required: boolean
}

interface CustomFieldsProps {
  fields: CustomField[]
  values: Record<string, string>
  onChange: (id: string, value: string) => void
}

export function CustomFields({ fields, values, onChange }: CustomFieldsProps) {
  return (
    <div className="space-y-2">
      {fields.map(field => (
        <div key={field.id}>
          <label className="flex items-center gap-1 text-sm text-primary/70">
            {field.name}
            {field.required && <span className="text-primary/70">*</span>}
          </label>
          
          {field.type === 'boolean' ? (
            <div className="flex items-center h-9 space-x-2">
              <Switch
                id={field.id}
                checked={values[field.id] === 'true'}
                onCheckedChange={(checked: boolean) => {
                  onChange(field.id, checked ? 'true' : 'false')
                }}
              />
            </div>
          ) : (
            <Input
              type={field.type === 'number' ? 'number' : 'text'}
              value={values[field.id] || ''}
              onChange={e => onChange(field.id, e.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}
    </div>
  )
} 