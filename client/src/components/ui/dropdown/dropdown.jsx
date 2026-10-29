import { forwardRef, createContext, useContext, useState, useRef, useEffect } from 'react'
import { cn } from '../../../lib/utils.js'

const DropdownContext = createContext()

function Dropdown({ children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}
Dropdown.displayName = 'Dropdown'

function DropdownTrigger({ asChild, children, ...props }) {
  const { open, setOpen } = useContext(DropdownContext)
  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup="true"
      {...props}
    >
      {children}
    </Comp>
  )
}
DropdownTrigger.displayName = 'DropdownTrigger'

const DropdownContent = forwardRef(({ className, align = 'start', sideOffset = 8, style, children, ...props }, ref) => {
  const { open, setOpen } = useContext(DropdownContext)

  return open ? (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-32 overflow-hidden rounded-md border border-border bg-background p-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      onClick={() => setOpen(false)}
      role="menu"
      {...props}
      style={{ marginTop: sideOffset, ...style }}
    >
      {children}
    </div>
  ) : null
})
DropdownContent.displayName = 'DropdownContent'

const DropdownItem = forwardRef(({ className, inset, ...props }, ref) => {
  return (
    <button
      ref={ref}
      role="menuitem"
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
})
DropdownItem.displayName = 'DropdownItem'

const DropdownSeparator = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
})
DropdownSeparator.displayName = 'DropdownSeparator'

const DropdownLabel = forwardRef(({ className, inset, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', inset && 'pl-8', className)}
      {...props}
    />
  )
})
DropdownLabel.displayName = 'DropdownLabel'

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
}
