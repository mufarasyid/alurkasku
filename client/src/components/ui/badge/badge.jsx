import { forwardRef } from 'react'
import { cn } from '../../../lib/utils.js'
import { badgeVariants } from './badge-variants.js'

const Badge = forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
})
Badge.displayName = 'Badge'

export { Badge }
