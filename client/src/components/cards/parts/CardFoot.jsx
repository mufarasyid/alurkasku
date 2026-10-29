import { cn } from "../../../lib/utils";

const CardFoot = ({ className, children }) => (
  <div
    className={cn(
      "mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground",
      className,
    )}
  >
    {children}
  </div>
);

export default CardFoot;
