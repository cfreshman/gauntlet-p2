import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { CustomField as CustomFieldType } from '../../lib/hooks/useCustomFields'

interface Props {
  field: CustomFieldType
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function CustomField({ field, value, onChange, readOnly = false }: Props) {
  return (
    <div className="w-full">
      <Label className="text-sm text-primary/70">{field.name}</Label>
      <div className="mt-1">
        {field.type === 'text' && (
          <Input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            readOnly={readOnly}
            required={field.required}
          />
        )}
        {field.type === 'number' && (
          <Input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            readOnly={readOnly}
            required={field.required}
          />
        )}
        {field.type === 'boolean' && (
          <Switch
            checked={value === 'true'}
            onCheckedChange={checked => onChange(checked.toString())}
            disabled={readOnly}
            required={field.required}
          />
        )}
        {field.type === 'date' && (
          <Input
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            readOnly={readOnly}
            required={field.required}
          />
        )}
      </div>
    </div>
  )
} 