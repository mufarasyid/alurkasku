import { forwardRef, createContext, useContext, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../lib/utils.js'

const DropdownContext = createContext()

function Dropdown({ children }) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const rootRef = useRef(null)
  const contentRef = useRef(null)

  const updateAnchor = useCallback(() => {
    if (rootRef.current) {
      setAnchorRect(rootRef.current.getBoundingClientRect())
    }
  }, [])

  useEffect(() => {
    if (!open) return

    updateAnchor()

    const handleClickOutside = (e) => {
      if (rootRef.current?.contains(e.target)) return
      if (contentRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    // Capture phase catches scrolling inside scrollable ancestors (e.g. table wrapper),
    // so the fixed-position menu follows its trigger.
    window.addEventListener('resize', updateAnchor)
    window.addEventListener('scroll', updateAnchor, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
      window.removeEventListener('resize', updateAnchor)
      window.removeEventListener('scroll', updateAnchor, true)
    }
  }, [open, updateAnchor])

  return (
    <DropdownContext.Provider value={{ open, setOpen, rootRef, contentRef, anchorRect }}>
      <div ref={rootRef} className="relative inline-block">
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
  const { open, setOpen, contentRef, anchorRect } = useContext(DropdownContext)
  const [dropUp, setDropUp] = useState(false)
  const [measured, setMeasured] = useState(false)

  const restStyle = { ...(style ?? {}) }
  delete restStyle.marginTop
  const hasCustomPosition = Boolean(
    style && (style.position !== undefined || style.top !== undefined || style.bottom !== undefined || style.left !== undefined || style.right !== undefined)
  )

  // Measuring the menu and mirroring it into state is the sanctioned pattern for
  // flip-on-overflow popups; this runs before paint so there is no visible flash.
  useLayoutEffect(() => {
    if (!open) return
    if (hasCustomPosition || !anchorRect || !contentRef?.current) return
    const height = contentRef.current.offsetHeight
    const spaceBelow = window.innerHeight - anchorRect.bottom - sideOffset
    const spaceAbove = anchorRect.top - sideOffset
    setDropUp(spaceBelow < height && spaceAbove > spaceBelow)
    setMeasured(true)
  }, [open, anchorRect, sideOffset, hasCustomPosition, contentRef])

  if (!open) return null

  const mergedRef = (node) => {
    if (contentRef) contentRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const menu = (
    <div
      ref={mergedRef}
      className={cn(
        'fixed z-[100] min-w-32 overflow-hidden rounded-md border border-border bg-background p-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        className
      )}
      onClick={() => setOpen(false)}
      role="menu"
      {...props}
      style={{
        ...(!hasCustomPosition && !anchorRect ? { top: 0, left: 0 } : {}),
        ...(!hasCustomPosition && anchorRect
          ? dropUp
            ? { bottom: window.innerHeight - anchorRect.top + sideOffset }
            : { top: anchorRect.bottom + sideOffset }
          : {}),
        ...(!hasCustomPosition && anchorRect
          ? align === 'end'
            ? { right: window.innerWidth - anchorRect.right }
            : { left: anchorRect.left }
          : {}),
        // Caller-supplied positioning (e.g. sidebar flyout) always wins.
        ...restStyle,
        // Pre-measure render stays hidden for a frame to avoid a wrong-side flash.
        ...(!hasCustomPosition && (!anchorRect || !measured) ? { visibility: 'hidden' } : {}),
      }}
    >
      {children}
    </div>
  )

  // Render at the body root so overflow-hidden/auto ancestors (card, table wrapper)
  // cannot clip the menu — e.g. a trigger on the last table row above the pagination.
  return typeof document !== 'undefined' ? createPortal(menu, document.body) : menu
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
