import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../ui/button/button-variants";
import { Input } from "../ui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "../ui/dropdown";
import CardDashboard from "../templates/CardDashboard";
import CardBody from "./parts/CardBody";
import { Skeleton } from "../ui/skeleton";
import {
  EllipsisVertical,
  Funnel,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  RefreshCw,
} from "lucide-react";
import { resolveIcon } from "../../lib/icon-map";
import { formatIDR, formatShortDate } from "../../lib/format";

const TYPE_FILTERS = [
  { key: "all", label: "All transactions" },
  { key: "Income", label: "Income only" },
  { key: "Expense", label: "Expenses only" },
];

const ActivityTransactionCard = ({ items = [], isLoading, className, onRefresh }) => {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!q) return true;
      return (
        (item.note ?? "").toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q) ||
        (item.account ?? "").toLowerCase().includes(q) ||
        String(item.amount).includes(q)
      );
    });
  }, [items, query, typeFilter]);

  const activeFilterLabel = TYPE_FILTERS.find(({ key }) => key === typeFilter)?.label;

  return (
    <CardDashboard
      className={cn("border-slate-300 text-slate-950", className)}
      title="Activity Transactions"
      description="Latest transactions this period"
      action={
        <div className="flex flex-wrap justify-end gap-2">
          <div className="relative">
            <Search
              size={17}
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions"
              aria-label="Search transactions"
              className="h-9 w-full pl-9 sm:w-48"
            />
          </div>

          <Dropdown>
            <DropdownTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "md" }),
                "h-9 gap-2",
              )}
              aria-label={`Filter: ${activeFilterLabel}`}
            >
              <Funnel size={17} strokeWidth={1.8} />
              <p className="hidden sm:inline">{activeFilterLabel}</p>
            </DropdownTrigger>
            <DropdownContent align="end">
              {TYPE_FILTERS.map(({ key, label }) => (
                <DropdownItem
                  key={key}
                  className="gap-2"
                  onClick={() => setTypeFilter(key)}
                >
                  <span className="flex w-4 items-center justify-center">
                    {typeFilter === key && <Check className="size-4" />}
                  </span>
                  {label}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "size-9 text-muted-foreground",
              )}
              aria-label="More actions"
            >
              <EllipsisVertical size={17} />
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem className="gap-2" onClick={onRefresh}>
                <RefreshCw className="size-4" />
                Refresh
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      }
    >
      <CardBody className="min-h-0">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-1" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {query || typeFilter !== "all"
                ? "No transactions match this filter."
                : "No transactions yet."}
            </p>
            {!query && typeFilter === "all" && (
              <p className="text-xs text-muted-foreground">
                Add your first transaction to see activity here.
              </p>
            )}
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-y-auto">
            {visibleItems.map((item) => {
              const Icon = resolveIcon(
                item.category_icon,
                item.type === "Income" ? ArrowDownLeft : ArrowUpRight,
              );
              const isIncome = item.type === "Income";
              return (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {item.note || item.category || "Transaction"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.account}
                      {item.category ? ` · ${item.category}` : ""}
                      {item.occurred_at ? ` · ${formatShortDate(item.occurred_at)}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-medium tabular-nums",
                      isIncome
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-foreground",
                    )}
                  >
                    {isIncome ? "+" : "−"}
                    {formatIDR(item.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </CardDashboard>
  );
};

export default ActivityTransactionCard;
