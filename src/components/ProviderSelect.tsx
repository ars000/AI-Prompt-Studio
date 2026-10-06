import { listSelectableProviders } from '../lib/aiProviders/registry'
import type { AiProvider } from '../schemas'

type Props = {
  value: AiProvider
  onChange: (p: AiProvider) => void
  className?: string
  id?: string
}

export function ProviderSelect({ value, onChange, className = '', id }: Props) {
  const options = listSelectableProviders()
  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value as AiProvider)}
    >
      {options.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </select>
  )
}
