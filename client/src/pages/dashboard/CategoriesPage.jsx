import { useState } from "react";
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

const DUMMY_CATEGORIES = [
  {
    id: 1,
    name: "Salary",
    type: "Income",
    icon: Briefcase,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 2,
    name: "Freelance",
    type: "Income",
    icon: Laptop,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 3,
    name: "Investments",
    type: "Income",
    icon: TrendingUp,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 4,
    name: "Food & Drinks",
    type: "Expense",
    icon: Utensils,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 5,
    name: "Transportation",
    type: "Expense",
    icon: Car,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 6,
    name: "Shopping",
    type: "Expense",
    icon: ShoppingBag,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 7,
    name: "Housing & Utilities",
    type: "Expense",
    icon: Home,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 8,
    name: "Health",
    type: "Expense",
    icon: HeartPulse,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 9,
    name: "Entertainment",
    type: "Expense",
    icon: Clapperboard,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 10,
    name: "Education",
    type: "Expense",
    icon: GraduationCap,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 11,
    name: "Travel",
    type: "Expense",
    icon: Plane,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 12,
    name: "Subscriptions",
    type: "Expense",
    icon: Repeat,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 13,
    name: "Gifts & Donations",
    type: "Expense",
    icon: Gift,
    iconClass: "bg-muted text-foreground",
  },
  {
    id: 14,
    name: "Coffee",
    type: "Expense",
    icon: Coffee,
    iconClass: "bg-muted text-foreground",
  },
];

const DEFAULT_ICON_CLASS = "bg-muted text-muted-foreground";

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
      const Icon = row.icon;
      return (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              row.iconClass,
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
  const [categories, setCategories] = useState(DUMMY_CATEGORIES);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [formDialog, setFormDialog] = useState(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("Expense");
  const [formIcon, setFormIcon] = useState(Tag);
  const [iconQuery, setIconQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

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
    setFormIcon(Tag);
    setIconQuery("");
    setFormDialog({ mode: "add" });
  };

  const openEditDialog = (row) => {
    setFormName(row.name);
    setFormType(row.type);
    setFormIcon(row.icon ?? Tag);
    setIconQuery("");
    setFormDialog({ mode: "edit", row });
  };

  const closeFormDialog = () => setFormDialog(null);

  const handleSaveCategory = (event) => {
    event.preventDefault();
    const name = formName.trim();
    if (!name) return;

    if (formDialog?.mode === "edit") {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === formDialog.row.id
            ? { ...category, name, type: formType, icon: formIcon }
            : category,
        ),
      );
    } else {
      setCategories((prev) => [
        {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          name,
          type: formType,
          icon: formIcon,
          iconClass: DEFAULT_ICON_CLASS,
        },
        ...prev,
      ]);
    }
    closeFormDialog();
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    const ids = new Set(pendingDelete.map((row) => row.id));
    setCategories((prev) => prev.filter((category) => !ids.has(category.id)));
    setSelected((prev) => new Set([...prev].filter((id) => !ids.has(id))));
    setPendingDelete(null);
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
          <Button variant="outline">
            <Download size={19} strokeWidth={1.8} />
            <p>Export</p>
          </Button>
        </div>
      </div>

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
                    const active = formIcon === Icon;
                    return (
                      <button
                        key={name}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={`Icon ${name}`}
                        title={name}
                        onClick={() => setFormIcon(Icon)}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {formDialog?.mode === "edit" ? "Save changes" : "Add category"}
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
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={17} strokeWidth={1.8} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;
