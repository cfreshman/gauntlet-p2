import { CustomField, CustomFieldType } from './CustomField'

interface CustomFieldsProps {
  fields: CustomFieldType[]
  values: Record<string, string>
  onChange: (id: string, value: string) => void
  readOnly?: boolean
  errors?: Record<string, string>
  className?: string
}

export function CustomFields({ 
  fields, 
  values, 
  onChange,
  readOnly = false,
  errors = {},
  className 
}: CustomFieldsProps) {
  return (
    <div className={className}>
      {fields.map(field => (
        <CustomField
          key={field.id}
          field={field}
          value={values[field.id] || ''}
          onChange={value => onChange(field.id, value)}
          readOnly={readOnly}
          error={errors[field.id]}
          className="mb-4 last:mb-0"
        />
      ))}
    </div>
  )
} 