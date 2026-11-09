import { useEffect, useRef, useState } from "react";
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  HeartPulse,
  Clapperboard,
  GraduationCap,
  Plane,
  Repeat,
  Gift,
  Coffee,
  Tag,
  Download,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  List,
  ListFilter,
  Search,
  Wallet,
  CreditCard,
  Banknote,
  PiggyBank,
  Landmark,
  Receipt,
  ShoppingCart,
  Shirt,
  Dumbbell,
  Fuel,
  Bus,
  Bike,
  Train,
  Smartphone,
  Monitor,
  Gamepad2,
  BookOpen,
  Music,
  Film,
  Tv,
  PawPrint,
  Baby,
  Wrench,
  Zap,
  Droplets,
  Wifi,
  Lightbulb,
  Umbrella,
  Building2,
  Globe,
  Apple,
  Sparkles,
  Scissors,
  Flower2,
  Sandwich,
  Martini,
  Beer,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Input, RupiahInput } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { DataTable } from "../../components/ui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "../../components/ui/dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectEmptyItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import {
  getBudgets,
  createBudget,
  updateBudget,
  bulkDeleteBudgets,
} from "../../services/budgets";
import { getCategories } from "../../services/categories";
import { useDebouncedValue } from "../../lib/use-debounced-value";

const ICON_LIST = [
  { name: "Utensils", Icon: Utensils },
  { name: "Car", Icon: Car },
  { name: "ShoppingBag", Icon: ShoppingBag },
  { name: "Home", Icon: Home },
  { name: "HeartPulse", Icon: HeartPulse },
  { name: "Clapperboard", Icon: Clapperboard },
  { name: "GraduationCap", Icon: GraduationCap },
  { name: "Plane", Icon: Plane },
  { name: "Repeat", Icon: Repeat },
  { name: "Gift", Icon: Gift },
  { name: "Coffee", Icon: Coffee },
  { name: "Wallet", Icon: Wallet },
  { name: "CreditCard", Icon: CreditCard },
  { name: "Banknote", Icon: Banknote },
  { name: "PiggyBank", Icon: PiggyBank },
  { name: "Landmark", Icon: Landmark },
  { name: "Receipt", Icon: Receipt },
  { name: "ShoppingCart", Icon: ShoppingCart },
  { name: "Shirt", Icon: Shirt },
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "Fuel", Icon: Fuel },
  { name: "Bus", Icon: Bus },
  { name: "Bike", Icon: Bike },
  { name: "Train", Icon: Train },
  { name: "Smartphone", Icon: Smartphone },
  { name: "Monitor", Icon: Monitor },
  { name: "Gamepad2", Icon: Gamepad2 },
  { name: "BookOpen", Icon: BookOpen },
  { name: "Music", Icon: Music },
  { name: "Film", Icon: Film },
  { name: "Tv", Icon: Tv },
  { name: "PawPrint", Icon: PawPrint },
  { name: "Baby", Icon: Baby },
  { name: "Wrench", Icon: Wrench },
  { name: "Zap", Icon: Zap },
  { name: "Droplets", Icon: Droplets },
  { name: "Wifi", Icon: Wifi },
  { name: "Lightbulb", Icon: Lightbulb },
  { name: "Umbrella", Icon: Umbrella },
  { name: "Building2", Icon: Building2 },
  { name: "Globe", Icon: Globe },
  { name: "Apple", Icon: Apple },
  { name: "Sparkles", Icon: Sparkles },
  { name: "Scissors", Icon: Scissors },
  { name: "Flower2", Icon: Flower2 },
  { name: "Sandwich", Icon: Sandwich },
  { name: "Martini", Icon: Martini },
  { name: "Beer", Icon: Beer },
  { name: "Tag", Icon: Tag },
];


const ICON_MAP = Object.fromEntries(
  ICON_LIST.map(({ name, Icon }) => [name, Icon]),
);

const resolveIcon = (name, fallback = Tag) => ICON_MAP[name] ?? fallback;

const DEFAULT_ICON_CLASS = "bg-muted text-muted-foreground";

const PERIODS = ["Weekly", "Monthly", "Yearly"];

const formatIDR = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const getUsage = (row) => {
  const limit = row.limit ?? 0;
  if (!limit) return 0;
  return (row.spent ?? 0) / limit;
};

const getStatus = (row) => {
  const usage = getUsage(row);
  if (usage >= 1) return "Over";
  if (usage >= 0.9) return "Warning";
  return "On track";
};

const StatusPill = ({ status }) => {
  const tone =
    status === "Over"
      ? "bg-destructive/10 text-destructive"
      : status === "Warning"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  const dot =
    status === "Over"
      ? "bg-destructive"
      : status === "Warning"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        tone,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {status}
    </span>
  );
};

const UsageBar = ({ row }) => {
  const usage = getUsage(row);
  const pct = Math.round(usage * 100);
  const tone =
    usage >= 1 ? "bg-destructive" : usage >= 0.9 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="tabular-nums text-muted-foreground">
          {formatIDR(row.spent)} / {formatIDR(row.limit)}
        </span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${row.name} usage`}
      >
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
};

const buildColumns = () => [
  {
    key: "name",
    header: "Budget",
    sortable: true,
    width: "min-w-[220px]",
    render: (_, row) => {
      const Icon = resolveIcon(row.icon);
      return (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              DEFAULT_ICON_CLASS,
            )}
          >
            <Icon className="size-4" strokeWidth={1.8} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">{row.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.category || "Uncategorized"}
            </span>
          </span>
        </div>
      );
    },
  },
  {
    key: "period",
    header: "Period",
    sortable: true,
    width: "w-[130px]",
    render: (value) => (
      <span className="text-sm text-muted-foreground">{value}</span>
    ),
  },
  {
    key: "usage",
    header: "Usage",
    sortable: true,
    width: "min-w-[240px]",
    accessor: (row) => getUsage(row) * 100,
    render: (_, row) => <UsageBar row={row} />,
  },
  {
    key: "limit",
    header: "Limit",
    sortable: true,
    width: "w-[160px]",
    align: "right",
    render: (value) => (
      <span className="font-medium tabular-nums">{formatIDR(value)}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    width: "w-[140px]",
    accessor: (row) => getStatus(row),
    render: (value) => <StatusPill status={value} />,
  },
];

const columns = buildColumns();

const TABS = [
  { key: "all", label: "All", icon: List },
  { key: "Weekly", label: "Weekly", icon: Repeat },
  { key: "Monthly", label: "Monthly", icon: ListFilter },
  { key: "Yearly", label: "Yearly", icon: Plane },
];

const STATUS_FILTERS = [
  { key: "all", label: "Any status" },
  { key: "On track", label: "On track" },
  { key: "Warning", label: "Warning" },
  { key: "Over", label: "Over" },
];

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, Weekly: 0, Monthly: 0, Yearly: 0 });
  const [reloadToken, setReloadToken] = useState(0);
  const hasLoadedRef = useRef(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [formDialog, setFormDialog] = useState(null);
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPeriod, setFormPeriod] = useState("Monthly");
  const [formLimit, setFormLimit] = useState("");
  const [formSpent, setFormSpent] = useState("");
  const [formIcon, setFormIcon] = useState("Tag");
  const [iconQuery, setIconQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    let active = true;
    getBudgets({
      page,
      page_size: 10,
      q: debouncedQuery || undefined,
      period: tab === "all" ? undefined : tab,
    })
      .then((res) => {
        if (!active) return;
        setBudgets(res.data ?? []);
        setTotalPages(res.meta?.total_pages ?? 1);
        setLoadError("");
      })
      .catch((err) => {
        if (active) setLoadError(err.message || "Failed to load budgets.");
      })
      .finally(() => {
        if (active && !hasLoadedRef.current) {
          hasLoadedRef.current = true;
          setIsLoading(false);
        }
      });
    getCategories({ type: "Expense", page_size: 100 })
      .then((res) => {
        if (active) setExpenseCategories(res.data ?? []);
      })
      .catch(() => {
        if (active) setExpenseCategories([]);
      });
    return () => {
      active = false;
    };
  }, [page, debouncedQuery, tab, reloadToken]);

  useEffect(() => {
    let active = true;
    Promise.all(
      ["all", "Weekly", "Monthly", "Yearly"].map(async (key) => {
        const res = await getBudgets({
          page_size: 1,
          period: key === "all" ? undefined : key,
        });
        return [key, res.meta?.total_items ?? 0];
      }),
    )
      .then((entries) => {
        if (active) setCounts(Object.fromEntries(entries));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const reloadBudgets = () => setReloadToken((token) => token + 1);

  // Paging, period and search are done on the server; budgets is the current
  // page. Status is derived from spent/limit, so it stays a client filter.
  const visibleBudgets = budgets.filter((budget) => {
    if (statusFilter !== "all" && getStatus(budget) !== statusFilter)
      return false;
    return true;
  });

  const filteredIcons = ICON_LIST.filter(({ name }) =>
    name.toLowerCase().includes(iconQuery.trim().toLowerCase()),
  );

  const openAddDialog = () => {
    setFormName("");
    setFormCategoryId("");
    setFormPeriod("Monthly");
    setFormLimit("");
    setFormSpent("");
    setFormIcon("Tag");
    setIconQuery("");
    setFormError("");
    setFormDialog({ mode: "add" });
  };

  const openEditDialog = (row) => {
    setFormName(row.name);
    setFormCategoryId(row.category_id ?? "");
    setFormPeriod(row.period);
    setFormLimit(String(row.limit ?? 0));
    setFormSpent(String(row.spent ?? 0));
    setFormIcon(row.icon ?? "Tag");
    setIconQuery("");
    setFormError("");
    setFormDialog({ mode: "edit", row });
  };

  const closeFormDialog = () => {
    setFormDialog(null);
    setFormError("");
  };

  const handleSaveBudget = async (event) => {
    event.preventDefault();
    const name = formName.trim();
    if (!name) return;
    const limit = Number(formLimit);
    const safeLimit = Number.isFinite(limit) && limit >= 0 ? limit : 0;
    const spent = Number(formSpent);
    const safeSpent = Number.isFinite(spent) && spent >= 0 ? spent : 0;
    const payload = {
      name,
      category_id: formCategoryId || "",
      period: formPeriod,
      limit: safeLimit,
      spent: safeSpent,
      icon: formIcon,
    };

    setIsSaving(true);
    setFormError("");
    try {
      if (formDialog?.mode === "edit") {
        await updateBudget(formDialog.row.id, payload);
      } else {
        await createBudget(payload);
      }
      setPage(1);
      reloadBudgets();
      closeFormDialog();
    } catch (err) {
      setFormError(err.message || "Failed to save budget.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ids = pendingDelete.map((row) => row.id);
    const idSet = new Set(ids);
    setIsDeleting(true);
    try {
      await bulkDeleteBudgets(ids);
      setSelected((prev) => new Set([...prev].filter((id) => !idSet.has(id))));
      setPendingDelete(null);
      reloadBudgets();
    } catch (err) {
      setLoadError(err.message || "Failed to delete budgets.");
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchAllBudgets = async () => {
    const items = [];
    let page = 1;
    for (;;) {
      const res = await getBudgets({
        page,
        page_size: 100,
        q: debouncedQuery || undefined,
        period: tab === "all" ? undefined : tab,
      });
      items.push(...(res.data ?? []));
      const pages = res.meta?.total_pages ?? 1;
      if (page >= pages) break;
      page += 1;
    }
    return items;
  };

  const handleExport = async () => {
    const header = [
      "Name",
      "Category",
      "Period",
      "Limit (IDR)",
      "Spent (IDR)",
      "Status",
    ];
    const allBudgets = (await fetchAllBudgets().catch(() => visibleBudgets)).filter(
      (budget) =>
        statusFilter === "all" || getStatus(budget) === statusFilter,
    );
    const lines = allBudgets.map((budget) =>
      [
        csvEscape(budget.name),
        csvEscape(budget.category),
        csvEscape(budget.period),
        String(budget.limit ?? 0),
        String(budget.spent ?? 0),
        csvEscape(getStatus(budget)),
      ].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budgets.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearSelection = () => setSelected(new Set());

  const selectedRows = budgets.filter((budget) => selected.has(budget.id));

  return (
    <div className="flex w-full flex-col gap-6 md:min-h-0 md:flex-1">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold lg:text-3xl">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Set spending limits and track how much of each budget you have used.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <Button variant="outline" onClick={handleExport}>
            <Download size={19} strokeWidth={1.8} />
            <p>Export</p>
          </Button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex shrink-0 items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => setLoadError("")}
            aria-label="Dismiss error"
            className="rounded-md p-0.5 transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Table card */}
      <Card className="flex w-full shrink-0 flex-col overflow-hidden border-border/60 shadow-sm">
        {/* Tabs */}
        <div
          className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border/50 bg-muted/40 px-3 py-2.5 sm:px-4"
          role="tablist"
          aria-label="Filter by period"
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setTab(key);
                  setPage(1);
                }}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isActive
                    ? "bg-background font-semibold text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/15 text-muted-foreground",
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-border/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <ListFilter
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Filter budgets"
                aria-label="Filter budgets"
                className="h-9 rounded-full pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                aria-label="Filter by status"
                className="h-9 w-full rounded-full sm:w-44"
              >
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={6}>
                {STATUS_FILTERS.map(({ key, label }) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={openAddDialog} className="h-9 rounded-full px-5">
            <Plus size={17} strokeWidth={2} />
            <p>Add Budget</p>
          </Button>
        </div>

        {/* Table */}
        <CardContent className="p-3 sm:p-4">
          {isLoading ? (
            <div
              className="flex flex-col gap-4 py-2"
              aria-busy="true"
              aria-label="Loading budgets"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="hidden h-4 w-20 sm:block" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
          <DataTable
            columns={columns}
            data={visibleBudgets}
            pageSize={10}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyMessage={
              query || tab !== "all" || statusFilter !== "all"
                ? "No budgets match this filter."
                : "No budgets yet. Add your first budget to start tracking your spending limits."
            }
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            showActions
            actionsHeader=""
            actions={(row) => (
              <Dropdown>
                <DropdownTrigger
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={`Open actions for ${row.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </DropdownTrigger>
                <DropdownContent align="end">
                  <DropdownItem
                    className="gap-2"
                    onClick={() => openEditDialog(row)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setPendingDelete([row])}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            )}
          />
          )}
        </CardContent>
      </Card>

      {/* Selection action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-full bg-primary px-2 py-2 text-primary-foreground shadow-2xl">
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Clear selection"
            className="rounded-full p-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            <X className="size-4" />
          </button>
          <span
            className="flex size-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold tabular-nums"
            aria-hidden="true"
          >
            {selected.size}
          </span>
          <span className="pr-1 text-sm text-white/80">items selected</span>
          <span
            className="mx-1 hidden h-6 w-px bg-white/15 sm:block"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={() => {
              if (selectedRows.length === 1) openEditDialog(selectedRows[0]);
            }}
            disabled={selectedRows.length !== 1}
            title={
              selectedRows.length !== 1
                ? "Select exactly one row to edit"
                : "Edit selected budget"
            }
            className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-4 text-sm transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="size-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setPendingDelete(selectedRows)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog
        open={formDialog !== null}
        onOpenChange={(open) => !open && closeFormDialog()}
      >
        <DialogContent>
          <form onSubmit={handleSaveBudget}>
            <DialogHeader>
              <DialogTitle>
                {formDialog?.mode === "edit" ? "Edit budget" : "Add budget"}
              </DialogTitle>
              <DialogDescription>
                {formDialog?.mode === "edit"
                  ? "Update the details of this budget."
                  : "Create a spending limit to keep your expenses on track."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="budget-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="budget-name"
                  autoFocus
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="e.g. Groceries"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span id="budget-icon-label" className="text-sm font-medium">
                  Icon
                </span>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={iconQuery}
                    onChange={(event) => setIconQuery(event.target.value)}
                    placeholder="Search icons..."
                    aria-label="Search icons"
                    className="h-9 pl-9"
                  />
                </div>
                <div
                  role="radiogroup"
                  aria-labelledby="budget-icon-label"
                  className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto rounded-xl border border-border p-2"
                >
                  {filteredIcons.map(({ name, Icon }) => {
                    const active = formIcon === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={`Icon ${name}`}
                        title={name}
                        onClick={() => setFormIcon(name)}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4" strokeWidth={1.8} />
                      </button>
                    );
                  })}
                  {filteredIcons.length === 0 && (
                    <p className="col-span-full py-5 text-center text-xs text-muted-foreground">
                      No icons match "{iconQuery}".
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="budget-category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={formCategoryId || "none"}
                  onValueChange={(value) =>
                    setFormCategoryId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="budget-category" className="w-full">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={6}>
                    <SelectItem value="none">No category</SelectItem>
                    {expenseCategories.length === 0 && (
                      <SelectEmptyItem>No expense categories available</SelectEmptyItem>
                    )}
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {expenseCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No expense categories yet. Create one on the Categories page first.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="budget-period" className="text-sm font-medium">
                  Period
                </label>
                <Select value={formPeriod} onValueChange={setFormPeriod}>
                  <SelectTrigger id="budget-period" className="w-full">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={6}>
                    {PERIODS.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="budget-limit" className="text-sm font-medium">
                    Limit (Rp)
                  </label>
                  <RupiahInput
                    id="budget-limit"
                    value={formLimit}
                    onChange={(event) => setFormLimit(event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="budget-spent" className="text-sm font-medium">
                    Spent (Rp)
                  </label>
                  <RupiahInput
                    id="budget-spent"
                    value={formSpent}
                    onChange={(event) => setFormSpent(event.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeFormDialog} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Saving..."
                  : formDialog?.mode === "edit"
                    ? "Save changes"
                    : "Add budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDelete?.length === 1 ? "Delete budget" : "Delete budgets"}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.length === 1
                ? `Delete ${pendingDelete?.[0]?.name}? It will be removed from this list.`
                : `Delete ${pendingDelete?.length} selected budgets? They will be removed from this list.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 size={17} strokeWidth={1.8} />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetsPage;
