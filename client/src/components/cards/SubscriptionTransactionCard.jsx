import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";
import CardBody from "./parts/CardBody";
import { Skeleton } from "../ui/skeleton";
import { Repeat } from "lucide-react";
import { formatShortDate } from "../../lib/format";

const statusTone = (status) => {
  if (status === "active")
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (status === "inactive" || status === "cancelled")
    return "bg-muted text-muted-foreground";
  return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
};

const SubscriptionTransactionCard = ({ items = [], isLoading, className }) => (
  <CardDashboard
    className={cn("border-border text-primary", className)}
    title="Subscriptions"
    description="Recurring plans and renewals"
  >
    <CardBody className="min-h-0">
      {isLoading ? (
        <div className="flex flex-col gap-3 py-1" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No subscriptions yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Active subscriptions will appear here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-y-auto">
          {items.map((sub) => (
            <li key={sub.id} className="flex items-center gap-3 py-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Repeat className="size-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium capitalize">
                  {sub.plan}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {sub.end_date
                    ? `Renews ${formatShortDate(sub.end_date)}`
                    : "No end date"}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  statusTone(sub.status),
                )}
              >
                {sub.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CardBody>
  </CardDashboard>
);

export default SubscriptionTransactionCard;
