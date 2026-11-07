import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";
import CardBody from "./parts/CardBody";
import { Skeleton } from "../ui/skeleton";
import { resolveIcon } from "../../lib/icon-map";
import { formatIDR } from "../../lib/format";

const ExpenseBreakdownTransactionCard = ({ items = [], isLoading, className }) => {
  const total = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return (
    <CardDashboard
      className={cn("border-slate-300 text-slate-950", className)}
      title="Expense Breakdown"
      description="Top spending categories this period"
    >
      <CardBody className="min-h-0">
        {isLoading ? (
          <div className="flex flex-col gap-4 py-1" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No expenses yet this period.
            </p>
            <p className="text-xs text-muted-foreground">
              Breakdown appears once you log expenses.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4 overflow-y-auto">
            {items.map((item) => {
              const Icon = resolveIcon(item.icon);
              const pct = total > 0 ? (item.amount / total) * 100 : 0;
              return (
                <li key={item.category} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.category}
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatIDR(item.amount)}
                    </span>
                    <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.category} share of expenses`}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </CardDashboard>
  );
};

export default ExpenseBreakdownTransactionCard;
