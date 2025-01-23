import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { cn } from '../../lib/utils'

export interface CustomFieldType {
  id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'date'
  required: boolean
  owner_id?: string | null
}

interface Props {
  field: CustomFieldType
  value: string
  onChange: (value: string) => void
  className?: string
  error?: string
  showLabel?: boolean
  mode: 'edit' | 'view'
}

export function CustomField({ 
  field, 
  value, 
  onChange, 
  className,
  error,
  showLabel = true,
  mode = 'edit'
}: Props) {
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {showLabel && (
        <Label className="flex items-center gap-1 text-sm text-primary/70">
          {field.name}
          {field.required && mode === 'edit' && <span className="text-primary/70">*</span>}
        </Label>
      )}
      
      <div>
        {field.type === 'boolean' ? (
          mode === 'view' ? (
            <span className="text-primary">{value === 'true' ? 'yes' : 'no'}</span>
          ) : (
            <div className="flex items-center h-9 space-x-2">
              <Switch
                id={field.id}
                checked={value === 'true'}
                onCheckedChange={(checked: boolean) => {
                  onChange(checked ? 'true' : 'false')
                }}
              />
            </div>
          )
        ) : mode === 'view' ? (
          <span className="text-primary">
            {field.type === 'date' && value ? new Date(value).toLocaleDateString() : value || '-'}
          </span>
        ) : (
          <Input
            type={field.type}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={field.required}
            className={cn(error && "border-red-500")}
          />
        )}
      </div>

      {error && mode === 'edit' && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 