import { useEffect, useState } from "react";
import {
  Briefcase,
  Laptop,
  TrendingUp,
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
  ArrowDownLeft,
  ArrowUpRight,
  ListFilter,
  Search,
  Wallet,
  CreditCard,
  Banknote,
  PiggyBank,
  Landmark,
  Receipt,
  ShoppingCart,
  ShoppingBasket,
  Shirt,
  Dumbbell,
  Pill,
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
import { Input } from "../../components/ui/input";
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
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import {
  getCategories,
  createCategory,
  updateCategory,
  bulkDeleteCategories,
} from "../../services/categories";

const ICON_LIST = [
  { name: "Briefcase", Icon: Briefcase },
  { name: "Laptop", Icon: Laptop },
  { name: "TrendingUp", Icon: TrendingUp },
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
  { name: "ShoppingBasket", Icon: ShoppingBasket },
  { name: "Shirt", Icon: Shirt },
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "Pill", Icon: Pill },
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

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

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

const buildColumns = () => [
  {
    key: "name",
    header: "Category",
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
          <span className="font-medium">{row.name}</span>
        </div>
      );
    },
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    width: "w-[160px]",
    render: (value) => <TypePill value={value} />,
  },
];

const columns = buildColumns();

const TABS = [
  { key: "all", label: "All", icon: List },
  { key: "Income", label: "Income", icon: ArrowDownLeft },
  { key: "Expense", label: "Expense", icon: ArrowUpRight },
];

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [formDialog, setFormDialog] = useState(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("Expense");
  const [formIcon, setFormIcon] = useState("Tag");
  const [iconQuery, setIconQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((res) => {
        if (active) setCategories(res.data ?? []);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || "Failed to load categories.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = {
    all: categories.length,
    Income: categories.filter((category) => category.type === "Income").length,
    Expense: categories.filter((category) => category.type === "Expense")
      .length,
  };

  const visibleCategories = categories.filter((category) => {
    if (tab !== "all" && category.type !== tab) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      category.name.toLowerCase().includes(q) ||
      category.type.toLowerCase().includes(q)
    );
  });

  const filteredIcons = ICON_LIST.filter(({ name }) =>
    name.toLowerCase().includes(iconQuery.trim().toLowerCase()),
  );

  const openAddDialog = () => {
    setFormName("");
    setFormType("Expense");
    setFormIcon("Tag");
    setIconQuery("");
    setFormError("");
    setFormDialog({ mode: "add" });
  };

  const openEditDialog = (row) => {
    setFormName(row.name);
    setFormType(row.type);
    setFormIcon(row.icon ?? "Tag");
    setIconQuery("");
    setFormError("");
    setFormDialog({ mode: "edit", row });
  };

  const closeFormDialog = () => {
    setFormDialog(null);
    setFormError("");
  };

  const handleSaveCategory = async (event) => {
    event.preventDefault();
    const name = formName.trim();
    if (!name) return;
    const payload = { name, type: formType, icon: formIcon };

    setIsSaving(true);
    setFormError("");
    try {
      if (formDialog?.mode === "edit") {
        const res = await updateCategory(formDialog.row.id, payload);
        setCategories((prev) =>
          prev.map((category) =>
            category.id === res.data.id ? res.data : category,
          ),
        );
      } else {
        const res = await createCategory(payload);
        setCategories((prev) => [res.data, ...prev]);
      }
      closeFormDialog();
    } catch (err) {
      setFormError(err.message || "Failed to save category.");
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
      await bulkDeleteCategories(ids);
      setCategories((prev) =>
        prev.filter((category) => !idSet.has(category.id)),
      );
      setSelected((prev) => new Set([...prev].filter((id) => !idSet.has(id))));
      setPendingDelete(null);
    } catch (err) {
      setLoadError(err.message || "Failed to delete categories.");
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const header = ["Name", "Type"];
    const lines = visibleCategories.map((category) =>
      [csvEscape(category.name), csvEscape(category.type)].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "categories.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearSelection = () => setSelected(new Set());

  const selectedRows = categories.filter((category) =>
    selected.has(category.id),
  );

  return (
    <div className="flex w-full flex-col gap-6 md:min-h-0 md:flex-1">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold lg:text-3xl">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage categories for your transactions.
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
          aria-label="Filter by type"
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(key)}
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter categories"
                aria-label="Filter categories"
                className="h-9 rounded-full pl-9"
              />
            </div>
          </div>

          <Button onClick={openAddDialog} className="h-9 rounded-full px-5">
            <Plus size={17} strokeWidth={2} />
            <p>Add Category</p>
          </Button>
        </div>

        {/* Table */}
        <CardContent className="p-3 sm:p-4">
          {isLoading ? (
            <div
              className="flex flex-col gap-4 py-2"
              aria-busy="true"
              aria-label="Loading categories"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="ml-auto h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
          <DataTable
            columns={columns}
            data={visibleCategories}
            pageSize={10}
            emptyMessage={
              query || tab !== "all"
                ? "No categories match this filter."
                : "No categories yet. Add your first category to start tracking spending."
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
                : "Edit selected category"
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
          <form onSubmit={handleSaveCategory}>
            <DialogHeader>
              <DialogTitle>
                {formDialog?.mode === "edit" ? "Edit category" : "Add category"}
              </DialogTitle>
              <DialogDescription>
                {formDialog?.mode === "edit"
                  ? "Update the name or type of this category."
                  : "Create a new category for your transactions."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="category-name"
                  autoFocus
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="e.g. Groceries"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span id="category-icon-label" className="text-sm font-medium">
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
                  aria-labelledby="category-icon-label"
                  className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto rounded-xl border border-border p-2"
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
                <label htmlFor="category-type" className="text-sm font-medium">
                  Type
                </label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger id="category-type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={6}>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
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
                    : "Add category"}
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
              {pendingDelete?.length === 1
                ? "Delete category"
                : "Delete categories"}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.length === 1
                ? `Delete ${pendingDelete?.[0]?.name}? It will be removed from this list.`
                : `Delete ${pendingDelete?.length} selected categories? They will be removed from this list.`}
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

export default CategoriesPage;
