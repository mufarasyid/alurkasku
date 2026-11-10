import { ListFilter } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";

// Shared building blocks for the admin console tables (Accounts-style).
export const FilterInput = ({ value, onChange, placeholder, label }) => (
  <div className="relative w-full sm:w-72">
    <ListFilter
      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className="h-9 rounded-full pl-9"
    />
  </div>
);

export const Toolbar = ({ children }) => (
  <div className="flex shrink-0 flex-col gap-3 border-b border-border/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
    {children}
  </div>
);

export const TableSkeleton = ({ rows = 6, cols = 4 }) => (
  <div className="flex flex-col gap-4 py-2" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center gap-3">
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        {Array.from({ length: cols - 1 }).map((__, cell) => (
          <div key={cell} className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-full max-w-44" />
          </div>
        ))}
      </div>
    ))}
  </div>
);
