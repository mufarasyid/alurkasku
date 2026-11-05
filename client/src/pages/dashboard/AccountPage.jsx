import { useState } from "react";
import {
  Landmark,
  Building2,
  Wallet,
  WalletCards,
  CreditCard,
  Banknote,
  PiggyBank,
  Smartphone,
  QrCode,
  Coins,
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
  { name: "Landmark", Icon: Landmark },
  { name: "Building2", Icon: Building2 },
  { name: "Wallet", Icon: Wallet },
  { name: "WalletCards", Icon: WalletCards },
  { name: "CreditCard", Icon: CreditCard },
  { name: "Banknote", Icon: Banknote },
  { name: "PiggyBank", Icon: PiggyBank },
  { name: "Smartphone", Icon: Smartphone },
  { name: "QrCode", Icon: QrCode },
  { name: "Coins", Icon: Coins },
  { name: "Tag", Icon: Tag },
];

const DUMMY_ACCOUNTS = [
  {
    id: 1,
    name: "BCA Tahapan",
    type: "Bank",
    detail: "BCA •• 1234",
    balance: 12450000,
    icon: Landmark,
  },
  {
    id: 2,
    name: "Mandiri Tabungan",
    type: "Bank",
    detail: "Mandiri •• 5678",
    balance: 8720500,
    icon: Building2,
  },
  {
    id: 3,
    name: "BRI BritAma",
    type: "Bank",
    detail: "BRI •• 9012",
    balance: 3150000,
    icon: Landmark,
  },
  {
    id: 4,
    name: "BNI Taplus",
    type: "Bank",
    detail: "BNI •• 3456",
    balance: 1480000,
    icon: Building2,
  },
  {
    id: 5,
    name: "GoPay",
    type: "Wallet",
    detail: "0812 •• •• 7890",
    balance: 450000,
    icon: Smartphone,
  },
  {
    id: 6,
    name: "OVO",
    type: "Wallet",
    detail: "0813 •• •• 1122",
    balance: 275000,
    icon: QrCode,
  },
  {
    id: 7,
    name: "Dana",
    type: "Wallet",
    detail: "0856 •• •• 3344",
    balance: 180000,
    icon: Wallet,
  },
  {
    id: 8,
    name: "ShopeePay",
    type: "Wallet",
    detail: "0821 •• •• 5566",
    balance: 95000,
    icon: WalletCards,
  },
  {
    id: 9,
    name: "Cash",
    type: "Wallet",
    detail: "Physical cash",
    balance: 750000,
    icon: Banknote,
  },
];

const DEFAULT_ICON_CLASS = "bg-muted text-muted-foreground";

const formatIDR = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const TypePill = ({ value }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
      value === "Bank"
        ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
        : "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    )}
  >
    <span
      className={cn(
        "size-1.5 rounded-full",
        value === "Bank" ? "bg-sky-500" : "bg-violet-500",
      )}
    />
    {value}
  </span>
);

const buildColumns = () => [
  {
    key: "name",
    header: "Account",
    sortable: true,
    width: "min-w-[240px]",
    render: (_, row) => {
      const Icon = row.icon;
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
            <span className="text-xs text-muted-foreground">{row.detail}</span>
          </span>
        </div>
      );
    },
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    width: "w-[140px]",
    render: (value) => <TypePill value={value} />,
  },
  {
    key: "balance",
    header: "Balance",
    sortable: true,
    width: "w-[180px]",
    align: "right",
    render: (value) => (
      <span className="font-medium tabular-nums">{formatIDR(value)}</span>
    ),
  },
];

const columns = buildColumns();

const TABS = [
  { key: "all", label: "All", icon: List },
  { key: "Bank", label: "Banks", icon: Landmark },
  { key: "Wallet", label: "Wallets", icon: WalletCards },
];

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const AccountPage = () => {
  const [accounts, setAccounts] = useState(DUMMY_ACCOUNTS);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [formDialog, setFormDialog] = useState(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("Bank");
  const [formDetail, setFormDetail] = useState("");
  const [formBalance, setFormBalance] = useState("");
  const [formIcon, setFormIcon] = useState(Landmark);
  const [iconQuery, setIconQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const counts = {
    all: accounts.length,
    Bank: accounts.filter((account) => account.type === "Bank").length,
    Wallet: accounts.filter((account) => account.type === "Wallet").length,
  };

  const visibleAccounts = accounts.filter((account) => {
    if (tab !== "all" && account.type !== tab) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      account.name.toLowerCase().includes(q) ||
      account.type.toLowerCase().includes(q) ||
      (account.detail ?? "").toLowerCase().includes(q)
    );
  });

  const filteredIcons = ICON_LIST.filter(({ name }) =>
    name.toLowerCase().includes(iconQuery.trim().toLowerCase()),
  );

  const openAddDialog = () => {
    setFormName("");
    setFormType("Bank");
    setFormDetail("");
    setFormBalance("");
    setFormIcon(Landmark);
    setIconQuery("");
    setFormDialog({ mode: "add" });
  };

  const openEditDialog = (row) => {
    setFormName(row.name);
    setFormType(row.type);
    setFormDetail(row.detail ?? "");
    setFormBalance(String(row.balance ?? 0));
    setFormIcon(row.icon ?? Landmark);
    setIconQuery("");
    setFormDialog({ mode: "edit", row });
  };

  const closeFormDialog = () => setFormDialog(null);

  const handleSaveAccount = (event) => {
    event.preventDefault();
    const name = formName.trim();
    if (!name) return;
    const balance = Number(formBalance);
    const safeBalance = Number.isFinite(balance) && balance >= 0 ? balance : 0;
    const detail = formDetail.trim();

    if (formDialog?.mode === "edit") {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === formDialog.row.id
            ? {
                ...account,
                name,
                type: formType,
                detail,
                balance: safeBalance,
                icon: formIcon,
              }
            : account,
        ),
      );
    } else {
      setAccounts((prev) => [
        {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          name,
          type: formType,
          detail,
          balance: safeBalance,
          icon: formIcon,
        },
        ...prev,
      ]);
    }
    closeFormDialog();
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    const ids = new Set(pendingDelete.map((row) => row.id));
    setAccounts((prev) => prev.filter((account) => !ids.has(account.id)));
    setSelected((prev) => new Set([...prev].filter((id) => !ids.has(id))));
    setPendingDelete(null);
  };

  const handleExport = () => {
    const header = ["Name", "Type", "Detail", "Balance (IDR)"];
    const lines = visibleAccounts.map((account) =>
      [
        csvEscape(account.name),
        csvEscape(account.type),
        csvEscape(account.detail),
        String(account.balance ?? 0),
      ].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "accounts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearSelection = () => setSelected(new Set());

  const selectedRows = accounts.filter((account) => selected.has(account.id));

  return (
    <div className="flex w-full flex-col gap-6 md:min-h-0 md:flex-1">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold lg:text-3xl">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your accounts and their details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <Button variant="outline" onClick={handleExport}>
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
                placeholder="Filter accounts"
                aria-label="Filter accounts"
                className="h-9 rounded-full pl-9"
              />
            </div>
          </div>

          <Button onClick={openAddDialog} className="h-9 rounded-full px-5">
            <Plus size={17} strokeWidth={2} />
            <p>Add Account</p>
          </Button>
        </div>

        {/* Table */}
        <CardContent className="p-3 sm:p-4">
          <DataTable
            columns={columns}
            data={visibleAccounts}
            pageSize={10}
            emptyMessage={
              query || tab !== "all"
                ? "No accounts match this filter."
                : "No accounts yet. Add your first account to start tracking balances."
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
                : "Edit selected account"
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
          <form onSubmit={handleSaveAccount}>
            <DialogHeader>
              <DialogTitle>
                {formDialog?.mode === "edit" ? "Edit account" : "Add account"}
              </DialogTitle>
              <DialogDescription>
                {formDialog?.mode === "edit"
                  ? "Update the details of this account."
                  : "Add a bank account or wallet to track its balance."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="account-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="account-name"
                  autoFocus
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="e.g. BCA Tahapan"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span id="account-icon-label" className="text-sm font-medium">
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
                  aria-labelledby="account-icon-label"
                  className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto rounded-xl border border-border p-2"
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
                <label htmlFor="account-detail" className="text-sm font-medium">
                  Detail
                </label>
                <Input
                  id="account-detail"
                  value={formDetail}
                  onChange={(event) => setFormDetail(event.target.value)}
                  placeholder="e.g. BCA •• 1234"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="account-type" className="text-sm font-medium">
                    Type
                  </label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger id="account-type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={6}>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="Wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="account-balance"
                    className="text-sm font-medium"
                  >
                    Balance (Rp)
                  </label>
                  <Input
                    id="account-balance"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1000}
                    value={formBalance}
                    onChange={(event) => setFormBalance(event.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {formDialog?.mode === "edit" ? "Save changes" : "Add account"}
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
              {pendingDelete?.length === 1 ? "Delete account" : "Delete accounts"}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.length === 1
                ? `Delete ${pendingDelete?.[0]?.name}? It will be removed from this list.`
                : `Delete ${pendingDelete?.length} selected accounts? They will be removed from this list.`}
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

export default AccountPage;
