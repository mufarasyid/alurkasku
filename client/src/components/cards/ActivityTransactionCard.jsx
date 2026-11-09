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
import { DataTable } from "../ui/table/data-table";
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

const TypePill = ({ value }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
      value === "Income"
        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    )}
  >
    <span
      className={cn(
        "size-1.5 rounded-full",
        value === "Income" ? "bg-emerald-500" : "bg-amber-500",
      )}
    />
    {value}
  </span>
);

const columns = [
  {
    key: "transaction",
    header: "Transaction",
    accessor: (row) => row.note || row.category || "Transaction",
    sortable: true,
    render: (_value, row) => {
      const Icon = resolveIcon(
        row.category_icon,
        row.type === "Income" ? ArrowDownLeft : ArrowUpRight,
      );
      return (
        <span className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {row.note || row.category || "Transaction"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {row.category || "No category"}
            </span>
          </span>
        </span>
      );
    },
  },
  { key: "account", header: "Account", sortable: true },
  {
    key: "occurred_at",
    header: "Date",
    sortable: true,
    sortFn: (a, b) => new Date(a ?? 0) - new Date(b ?? 0),
    render: (value) => formatShortDate(value),
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    render: (value) => <TypePill value={value} />,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    sortable: true,
    render: (value, row) => {
      const isIncome = row.type === "Income";
      return (
        <span
          className={cn(
            "font-medium tabular-nums",
            isIncome
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-foreground",
          )}
        >
          {isIncome ? "+" : "−"}
          {formatIDR(value)}
        </span>
      );
    },
  },
];

const ActivityTransactionCard = ({
  items = [],
  isLoading,
  className,
  onRefresh,
}) => {
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

  const activeFilterLabel = TYPE_FILTERS.find(
    ({ key }) => key === typeFilter,
  )?.label;

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
        ) : (
          <DataTable
            columns={columns}
            data={visibleItems}
            pageSize={10}
            emptyMessage={
              query || typeFilter !== "all"
                ? "No transactions match this filter."
                : "No transactions yet. Add your first transaction to see activity here."
            }
          />
        )}
      </CardBody>
    </CardDashboard>
  );
};

export default ActivityTransactionCard;
