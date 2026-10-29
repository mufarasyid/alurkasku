import { cn } from "../../../lib/utils";

const CardPlaceholder = ({ className, children = "Content" }) => (
  <div
    className={cn(
      "flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground",
      className,
    )}
  >
    {children}
  </div>
);

export default CardPlaceholder;
