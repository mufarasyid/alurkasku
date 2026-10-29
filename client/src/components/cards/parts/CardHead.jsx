import { cn } from "../../../lib/utils";

const CardHead = ({
  title,
  description,
  action,
  className,
  descriptionClassName,
}) => (
  <div className={cn("flex items-start justify-between gap-3", className)}>
    <div className="min-w-0">
      <h2 className="truncate text-sm font-semibold">{title}</h2>

      {description && (
        <p
          className={cn(
            "mt-0.5 line-clamp-2 text-xs text-muted-foreground",
            descriptionClassName,
          )}
        >
          {description}
        </p>
      )}
    </div>

    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default CardHead;
