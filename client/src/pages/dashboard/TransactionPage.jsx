import { useEffect, useState } from "react";
import { Calendar, Download, Plus, X } from "lucide-react";

import { cn } from "../../lib/utils";
import { getPreferences } from "../../lib/preferences";
import { Button } from "../../components/ui/button";
import { Input, RupiahInput } from "../../components/ui/input";
import { DatePicker } from "../../components/ui/datepicker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectEmptyItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";

import {
  ActivityTransactionCard,
  ExpenseTransactionCard,
  IncomeTransactionCard,
  SubscriptionTransactionCard,
  TotalTransactionCard,
} from "../../components/cards";

import ExpenseBreakdownTransactionCard from "../../components/cards/ExpenseBreakdownTransactionCard";

import {
  getTransactions,
  getTransactionOverview,
  getTransactionBreakdown,
  createTransaction,
} from "../../services/transactions";
import { getMySubscriptions } from "../../services/subscriptions";
import { getAccounts } from "../../services/accounts";
import { getCategories } from "../../services/categories";

const GridCard = ({ className, children }) => (
  <div
    className={cn(
      "flex min-w-0 flex-col",
      "[&>*]:min-h-0 [&>*]:flex-1",
      className,
    )}
  >
    {children}
  </div>
);

const PERIODS = [
  { key: "this-month", label: "This Month" },
  { key: "last-month", label: "Last Month" },
  { key: "last-3-months", label: "Last 3 Months" },
  { key: "this-year", label: "This Year" },
];

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const todayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const TransactionPage = () => {
  const [period, setPeriod] = useState(() => getPreferences().defaultPeriod);
  const [loadedPeriod, setLoadedPeriod] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [overview, setOverview] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [activities, setActivities] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [formDialog, setFormDialog] = useState(false);
  const [formType, setFormType] = useState("Expense");
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDate, setFormDate] = useState(todayString);
  const [formCategories, setFormCategories] = useState([]);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = loadedPeriod !== period;

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getTransactionOverview({ period }),
      getTransactionBreakdown({ period }),
      getTransactions({ period, page_size: 100 }),
      getMySubscriptions(),
      getAccounts({ page_size: 100 }),
    ]).then(([ov, bd, act, sub, acc]) => {
      if (!active) return;
      if (ov.status === "fulfilled") setOverview(ov.value.data ?? null);
      if (bd.status === "fulfilled") setBreakdown(bd.value.data ?? []);
      if (act.status === "fulfilled") setActivities(act.value.data ?? []);
      if (sub.status === "fulfilled") setSubscriptions(sub.value.data ?? []);
      if (acc.status === "fulfilled") setAccounts(acc.value.data ?? []);

      if (ov.status === "rejected") {
        setLoadError(ov.reason?.message || "Failed to load transaction overview.");
      } else if (act.status === "rejected") {
        setLoadError(act.reason?.message || "Failed to load transactions.");
      } else {
        setLoadError("");
      }
      setLoadedPeriod(period);
    });
    return () => {
      active = false;
    };
  }, [period, reloadToken]);

  useEffect(() => {
    let active = true;
    getCategories({ type: formType, page_size: 100 })
      .then((res) => {
        if (active) setFormCategories(res.data ?? []);
      })
      .catch(() => {
        if (active) setFormCategories([]);
      });
    return () => {
      active = false;
    };
  }, [formType]);

  const openAddDialog = () => {
    setFormType("Expense");
    setFormAmount("");
    setFormNote("");
    setFormAccountId(accounts[0]?.id ?? "");
    setFormCategoryId("");
    setFormDate(todayString());
    setFormError("");
    setFormDialog(true);
  };

  const closeFormDialog = () => {
    setFormDialog(false);
    setFormError("");
  };

  const handleAddTransaction = async (event) => {
    event.preventDefault();
    const amount = Number(formAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Amount must be greater than 0.");
      return;
    }
    if (!formAccountId) {
      setFormError("Select an account.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      await createTransaction({
        account_id: formAccountId,
        category_id: formCategoryId || "",
        type: formType,
        amount,
        note: formNote.trim(),
        occurred_at: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
      });
      closeFormDialog();
      setReloadToken((token) => token + 1);
    } catch (err) {
      setFormError(err.message || "Failed to save transaction.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const header = ["Date", "Type", "Note", "Category", "Account", "Amount"];
    const lines = activities.map((item) =>
      [
        csvEscape(item.occurred_at?.slice(0, 10)),
        csvEscape(item.type),
        csvEscape(item.note),
        csvEscape(item.category),
        csvEscape(item.account),
        String(item.amount ?? 0),
      ].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `transactions-${period}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-6 lg:gap-7">

      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            Transaction Overview
          </h1>

          <p className="text-sm text-muted-foreground">
            View and manage all your income and expenses in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full min-w-[160px] sm:w-[180px]" aria-label="Select period">
              <div className="flex items-center gap-2">
                <Calendar
                  size={17}
                  className="shrink-0 text-muted-foreground"
                />
                <SelectValue placeholder="This Month" />
              </div>
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Select Period</SelectLabel>
                {PERIODS.map(({ key, label }) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExport}>
            <Download size={19} strokeWidth={1.8} />
            Export
          </Button>

          <Button variant="default" className="flex-1 sm:flex-none" onClick={openAddDialog}>
            <Plus size={19} strokeWidth={1.8} />
            Add Transaction
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

      {/* Dashboard Grid */}
      <div
        className="
          grid min-w-0 grid-cols-1 gap-4
          sm:grid-cols-2
          lg:grid-cols-12 lg:gap-5
          2xl:gap-6
        "
      >

        {/* Summary Cards */}
        <GridCard
          className="
            col-span-1 grid grid-cols-1 gap-4
            sm:col-span-2 sm:grid-cols-2
            lg:col-span-8 lg:grid-cols-3
          "
        >
          <TotalTransactionCard data={overview?.total} isLoading={isLoading} />
          <IncomeTransactionCard data={overview?.income} isLoading={isLoading} />
          <ExpenseTransactionCard data={overview?.expense} isLoading={isLoading} />
        </GridCard>

        {/* Expense Breakdown */}
        <GridCard
          className="
            min-h-[320px]
            sm:col-span-1
            lg:col-span-4
            lg:row-span-2
          "
        >
          <ExpenseBreakdownTransactionCard items={breakdown} isLoading={isLoading} />
        </GridCard>

        {/* Activity */}
        <GridCard
          className="
            min-h-[350px]
            sm:col-span-2
            lg:col-span-8
            lg:row-span-2
          "
        >
          <ActivityTransactionCard items={activities} isLoading={isLoading} onRefresh={() => setReloadToken((token) => token + 1)} />
        </GridCard>

        {/* Subscription */}
        <GridCard
          className="
            min-h-[300px]
            sm:col-span-2
            lg:col-span-4
          "
        >
          <SubscriptionTransactionCard items={subscriptions} isLoading={isLoading} />
        </GridCard>

      </div>

      {/* Add Transaction dialog */}
      <Dialog open={formDialog} onOpenChange={(open) => !open && closeFormDialog()}>
        <DialogContent>
          <form onSubmit={handleAddTransaction}>
            <DialogHeader>
              <DialogTitle>Add transaction</DialogTitle>
              <DialogDescription>
                Record income or an expense against one of your accounts.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="transaction-type" className="text-sm font-medium">
                    Type
                  </label>
                  <Select value={formType} onValueChange={(v) => { setFormType(v); setFormCategoryId(""); }}>
                    <SelectTrigger id="transaction-type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={6}>
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="transaction-date" className="text-sm font-medium">
                    Date
                  </label>
                  <DatePicker
                    key={formDialog ? "open" : "closed"}
                    id="transaction-date"
                    value={formDate}
                    max={todayString()}
                    onChange={setFormDate}
                    placeholder="Pick a date"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transaction-note" className="text-sm font-medium">
                  Note
                </label>
                <Input
                  id="transaction-note"
                  autoFocus
                  value={formNote}
                  onChange={(event) => setFormNote(event.target.value)}
                  placeholder="e.g. Groceries at supermarket"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transaction-account" className="text-sm font-medium">
                  Account
                </label>
                <Select value={formAccountId} onValueChange={setFormAccountId}>
                  <SelectTrigger id="transaction-account" className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={6}>
                    {accounts.length === 0 && (
                      <SelectEmptyItem>No accounts available</SelectEmptyItem>
                    )}
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {accounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No accounts yet. Create one on the Accounts page first.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transaction-category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={formCategoryId || "none"}
                  onValueChange={(v) => setFormCategoryId(v === "none" ? "" : v)}
                >
                  <SelectTrigger id="transaction-category" className="w-full">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={6}>
                    <SelectItem value="none">No category</SelectItem>
                    {formCategories.length === 0 && (
                      <SelectEmptyItem>No categories available</SelectEmptyItem>
                    )}
                    {formCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No categories yet for this type. Create one on the Categories page first.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transaction-amount" className="text-sm font-medium">
                  Amount (Rp)
                </label>
                <RupiahInput
                  id="transaction-amount"
                  value={formAmount}
                  onChange={(event) => setFormAmount(event.target.value)}
                  placeholder="0"
                  required
                />
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
                {isSaving ? "Saving..." : "Add transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionPage;
