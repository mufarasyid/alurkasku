import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "../../../lib/utils";

const DeltaFooter = ({ deltaPct, className }) => {
  if (deltaPct == null) {
    return (
      <div className={cn("flex items-center gap-1 text-muted-foreground", className)}>
        <Minus size={15} aria-hidden="true" />
        <p>No data from previous period</p>
      </div>
    );
  }

  const positive = deltaPct >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        positive ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
        className,
      )}
    >
      <Icon size={15} aria-hidden="true" />
      <p className="tabular-nums">
        {positive ? "+" : ""}
        {deltaPct.toFixed(1)}%
        <span className="text-muted-foreground"> vs previous period</span>
      </p>
    </div>
  );
};

export default DeltaFooter;
