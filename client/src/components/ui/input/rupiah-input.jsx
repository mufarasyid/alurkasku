import { forwardRef } from 'react'
import { cn } from '../../../lib/utils.js'
import { Input } from './input.jsx'
import { formatGroupedDigits } from '../../../lib/format.js'

const RupiahInput = forwardRef(
  ({ id, name, value, onChange, className, prefixClassName, placeholder = '0', ...props }, ref) => {
    const digits = String(value ?? '').replace(/\D/g, '')
    const display = formatGroupedDigits(digits)

    const handleChange = (event) => {
      const input = event.target
      const raw = input.value
      const cursor = input.selectionStart ?? raw.length
      const digitsBeforeCursor = raw.slice(0, cursor).replace(/\D/g, '').length
      const nextDigits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')

      onChange?.({ target: { value: nextDigits, name, id } })

      // Formatting inserts separators, which would shift the caret. Restore it
      // by counting digits before the caret in the newly formatted text.
      requestAnimationFrame(() => {
        if (!input.isConnected) return
        const formatted = formatGroupedDigits(nextDigits)
        let counted = 0
        let position = 0
        while (position < formatted.length && counted < digitsBeforeCursor) {
          if (/\d/.test(formatted[position])) counted += 1
          position += 1
        }
        try {
          input.setSelectionRange(position, position)
        } catch {
          // Selection APIs throw for some input types; text inputs are supported.
        }
      })
    }

    return (
      <div className="relative">
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground',
            prefixClassName
          )}
        >
          Rp
        </span>
        <Input
          id={id}
          name={name}
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={display}
          onChange={handleChange}
          className={cn('pl-10', className)}
          {...props}
        />
      </div>
    )
  }
)
RupiahInput.displayName = 'RupiahInput'

export { RupiahInput }
