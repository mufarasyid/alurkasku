import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ShieldCheck, Landmark, Tag } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatShortDate, formatIDR } from "../../lib/format";
import { useDebouncedValue } from "../../lib/use-debounced-value";
import {
  getAdminUser,
  getUserAccounts,
  getUserBudgets,
  getUserCategories,
  getUserOverview,
  getUserSubscriptions,
  getUserTransactions,
} from "../../services/admin";
import { resolveIcon } from "../../lib/icon-map";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardContent } from "../../components/ui/card";
import { DataTable } from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";

import { FilterInput, Toolbar, TableSkeleton } from "./components";

const PAGE_SIZE = 10;
const PERIODS = [
  { key: "this-month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "last-3-months", label: "Last 3 months" },
  { key: "this-year", label: "This year" },
];
const BUDGET_PERIODS = [
  { key: "all", label: "All periods" },
  { key: "Weekly", label: "Weekly" },
  { key: "Monthly", label: "Monthly" },
  { key: "Yearly", label: "Yearly" },
];
const CATEGORY_TYPES = [
  { key: "all", label: "All types" },
  { key: "Income", label: "Income" },
  { key: "Expense", label: "Expense" },
];
const TABS = [
  { key: "accounts", label: "Accounts" },
  { key: "transactions", label: "Transactions" },
  { key: "budgets", label: "Budgets" },
  { key: "categories", label: "Categories" },
  { key: "subscriptions", label: "Subscriptions" },
];

// Go zero-time (0001-01-01) serializes truthy; treat pre-2000 dates as absent.
const safeShortDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  if (date.getFullYear() < 2000) return null;
  return formatShortDate(value);
};

const TYPE_PILL_TONES = {
  Bank: {
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  Wallet: {
    pill: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  Cash: {
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

const TypePill = ({ value }) => {
  const tone = TYPE_PILL_TONES[value] ?? {
    pill:
      value === "Income"
        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: value === "Income" ? "bg-emerald-500" : "bg-amber-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        tone.pill,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", tone.dot)}
      />
      {value}
    </span>
  );
};

const SectionError = ({ message }) =>
  message ? (
    <p
      role="alert"
      className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  ) : null;

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [memberError, setMemberError] = useState("");
  const [tab, setTab] = useState("accounts");

  const [overview, setOverview] = useState(null);
  const [overviewPeriod, setOverviewPeriod] = useState("this-month");
  const [overviewError, setOverviewError] = useState("");

  const [accountQ, setAccountQ] = useState("");
  const [accountPage, setAccountPage] = useState(1);
  const [accounts, setAccounts] = useState(null);
  const [accountTotalPages, setAccountTotalPages] = useState(1);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountsError, setAccountsError] = useState("");

  const [trQ, setTrQ] = useState("");
  const [trPage, setTrPage] = useState(1);
  const [trPeriod, setTrPeriod] = useState("all");
  const [transactions, setTransactions] = useState(null);
  const [trTotalPages, setTrTotalPages] = useState(1);
  const [trLoading, setTrLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");

  const [buQ, setBuQ] = useState("");
  const [buPage, setBuPage] = useState(1);
  const [buPeriod, setBuPeriod] = useState("all");
  const [budgets, setBudgets] = useState(null);
  const [buTotalPages, setBuTotalPages] = useState(1);
  const [buLoading, setBuLoading] = useState(true);
  const [budgetsError, setBudgetsError] = useState("");

  const [caQ, setCaQ] = useState("");
  const [caPage, setCaPage] = useState(1);
  const [caType, setCaType] = useState("all");
  const [categories, setCategories] = useState(null);
  const [caTotalPages, setCaTotalPages] = useState(1);
  const [caLoading, setCaLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [subscriptions, setSubscriptions] = useState(null);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState("");

  const debouncedAccountQ = useDebouncedValue(accountQ);
  const debouncedTrQ = useDebouncedValue(trQ);
  const debouncedBuQ = useDebouncedValue(buQ);
  const debouncedCaQ = useDebouncedValue(caQ);

  useEffect(() => {
    let active = true;
    getAdminUser(id)
      .then((res) => active && setMember(res?.data ?? null))
      .catch(
        (err) =>
          active &&
          setMemberError(err.message || "Failed to load this member."),
      );
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    getUserOverview(id, overviewPeriod)
      .then((res) => {
        if (!active) return;
        setOverview(res?.data ?? null);
        setOverviewError("");
      })
      .catch((err) => {
        if (!active) return;
        setOverviewError(err.message || "Failed to load overview.");
      });
    return () => {
      active = false;
    };
  }, [id, overviewPeriod]);

  useEffect(() => {
    if (tab !== "accounts") return;
    let active = true;
    getUserAccounts(id, {
      page: accountPage,
      pageSize: PAGE_SIZE,
      q: debouncedAccountQ || undefined,
    })
      .then((res) => {
        if (!active) return;
        setAccounts(Array.isArray(res?.data) ? res.data : []);
        setAccountTotalPages(Math.max(1, res?.meta?.total_pages ?? 1));
        setAccountsError("");
        setAccountLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setAccounts([]);
        setAccountsError(err.message || "Failed to load accounts.");
        setAccountLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, tab, accountPage, debouncedAccountQ]);

  useEffect(() => {
    if (tab !== "transactions") return;
    let active = true;
    getUserTransactions(id, {
      page: trPage,
      pageSize: PAGE_SIZE,
      q: debouncedTrQ || undefined,
      period: trPeriod,
    })
      .then((res) => {
        if (!active) return;
        setTransactions(Array.isArray(res?.data) ? res.data : []);
        setTrTotalPages(Math.max(1, res?.meta?.total_pages ?? 1));
        setTransactionsError("");
        setTrLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setTransactions([]);
        setTransactionsError(err.message || "Failed to load transactions.");
        setTrLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, tab, trPage, trPeriod, debouncedTrQ]);

  useEffect(() => {
    if (tab !== "budgets") return;
    let active = true;
    getUserBudgets(id, {
      page: buPage,
      pageSize: PAGE_SIZE,
      q: debouncedBuQ || undefined,
      period: buPeriod === "all" ? undefined : buPeriod,
    })
      .then((res) => {
        if (!active) return;
        setBudgets(Array.isArray(res?.data) ? res.data : []);
        setBuTotalPages(Math.max(1, res?.meta?.total_pages ?? 1));
        setBudgetsError("");
        setBuLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setBudgets([]);
        setBudgetsError(err.message || "Failed to load budgets.");
        setBuLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, tab, buPage, buPeriod, debouncedBuQ]);

  useEffect(() => {
    if (tab !== "categories") return;
    let active = true;
    getUserCategories(id, {
      page: caPage,
      pageSize: PAGE_SIZE,
      q: debouncedCaQ || undefined,
      type: caType === "all" ? undefined : caType,
    })
      .then((res) => {
        if (!active) return;
        setCategories(Array.isArray(res?.data) ? res.data : []);
        setCaTotalPages(Math.max(1, res?.meta?.total_pages ?? 1));
        setCategoriesError("");
        setCaLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setCategories([]);
        setCategoriesError(err.message || "Failed to load categories.");
        setCaLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, tab, caPage, caType, debouncedCaQ]);

  useEffect(() => {
    if (tab !== "subscriptions") return;
    let active = true;
    getUserSubscriptions(id)
      .then((res) => {
        if (!active) return;
        setSubscriptions(Array.isArray(res?.data) ? res.data : []);
        setSubscriptionsError("");
        setSubsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setSubscriptions([]);
        setSubscriptionsError(err.message || "Failed to load subscriptions.");
        setSubsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, tab]);

  const accountColumns = [
    {
      key: "name",
      header: "Account",
      sortable: true,
      width: "min-w-[240px]",
      render: (_, row) => {
        const Icon = resolveIcon(row.icon, Landmark);
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" strokeWidth={1.8} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{row.name}</span>
              <span className="text-xs text-muted-foreground">
                {row.detail || "-"}
              </span>
            </span>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      width: "w-[130px]",
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

  const transactionColumns = [
    {
      key: "occurred_at",
      header: "Date",
      sortable: true,
      width: "w-[130px]",
      render: (value) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {safeShortDate(value) ?? "-"}
        </span>
      ),
    },
    {
      key: "note",
      header: "Transaction",
      accessor: (row) => row.note || row.category || "Transaction",
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.note || row.category || "Transaction"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.category || "-"}
            {row.account ? ` · ${row.account}` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "w-[110px]",
      render: (value) => <TypePill value={value} />,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      width: "w-[160px]",
      render: (value) => (
        <span className="font-medium tabular-nums whitespace-nowrap">
          {formatIDR(value ?? 0)}
        </span>
      ),
    },
  ];

  const budgetColumns = [
    {
      key: "name",
      header: "Budget",
      sortable: true,
      width: "min-w-[220px]",
      render: (_, row) => {
        const Icon = resolveIcon(row.icon, Tag);
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
      width: "w-[120px]",
    },
    {
      key: "limit",
      header: "Limit",
      sortable: true,
      align: "right",
      width: "w-[150px]",
      render: (value) => (
        <span className="tabular-nums">{formatIDR(value ?? 0)}</span>
      ),
    },
    {
      key: "spent",
      header: "Spent",
      sortable: true,
      align: "right",
      width: "w-[150px]",
      render: (value) => (
        <span className="tabular-nums">{formatIDR(value ?? 0)}</span>
      ),
    },
    {
      key: "used",
      header: "Used",
      width: "w-[110px]",
      align: "right",
      accessor: (row) =>
        Number(row.limit) > 0 ? Number(row.spent) / Number(row.limit) : 0,
      render: (value) => {
        const used = Math.round((value ?? 0) * 100);
        return (
          <span
            className={cn(
              "font-medium tabular-nums",
              used >= 100 && "text-destructive",
              used >= 90 && used < 100 && "text-amber-600 dark:text-amber-400",
            )}
          >
            {used}%
          </span>
        );
      },
    },
  ];

  const categoryColumns = [
    {
      key: "name",
      header: "Category",
      sortable: true,
      width: "min-w-[220px]",
      render: (_, row) => {
        const Icon = resolveIcon(row.icon, Tag);
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
      width: "w-[120px]",
      render: (value) => <TypePill value={value} />,
    },
  ];

  const subscriptionColumns = [
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value ?? "Subscription"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "w-[130px]",
      render: (value) => (
        <Badge variant={value === "active" ? "default" : "secondary"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "start_date",
      header: "Started",
      sortable: true,
      width: "w-[130px]",
      render: (value) => (
        <span className="text-muted-foreground">
          {safeShortDate(value) ?? "-"}
        </span>
      ),
    },
    {
      key: "end_date",
      header: "Ends",
      width: "w-[130px]",
      render: (value) => (
        <span className="text-muted-foreground">
          {safeShortDate(value) ?? "-"}
        </span>
      ),
    },
  ];

  if (memberError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <SectionError message={memberError} />
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/admin")}
          className="w-fit"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to members
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard/admin")}
          className="flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Members
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight lg:text-3xl">
            {member?.name ?? <Skeleton className="h-8 w-56" />}
            {member?.role && (
              <Badge
                variant={member.role === "admin" ? "default" : "secondary"}
                className="gap-1"
              >
                {member.role === "admin" && (
                  <ShieldCheck size={12} aria-hidden="true" />
                )}
                {member.role}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {member?.email ?? "Loading member…"}
            {member?.created_at &&
              ` · joined ${formatShortDate(member.created_at)}`}
          </p>
        </div>
      </div>

      {/* Overview strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Overview
        </h2>
        <Select value={overviewPeriod} onValueChange={setOverviewPeriod}>
          <SelectTrigger
            aria-label="Overview period"
            className="h-9 w-40 shrink-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="bottom" sideOffset={6}>
            {PERIODS.map(({ key, label }) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SectionError message={overviewError} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Income", key: "income", value: overview?.income?.amount },
          {
            label: "Expenses",
            key: "expense",
            value: overview?.expense?.amount,
          },
          { label: "Net flow", key: "total", value: overview?.total?.amount },
        ].map(({ label, key, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/60 bg-card p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 truncate text-2xl font-semibold">
              {overview === null ? (
                <Skeleton className="h-7 w-36" />
              ) : (
                formatIDR(value ?? 0)
              )}
            </p>
            {overview?.[key]?.delta_pct != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {(overview[key].delta_pct >= 0 ? "+" : "") +
                  overview[key].delta_pct.toFixed(1) +
                  "% vs previous period"}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Data tabs - Accounts-style tables with server pagination */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap justify-start rounded-xl p-1">
          {TABS.map(({ key, label }) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Accounts */}
        <TabsContent value="accounts" className="mt-4">
          <Card className="flex w-full shrink-0 flex-col overflow-hidden border-border/60 shadow-sm">
            <Toolbar>
              <FilterInput
                value={accountQ}
                onChange={(value) => {
                  setAccountQ(value);
                  setAccountPage(1);
                  setAccountLoading(true);
                }}
                placeholder="Filter accounts"
                label="Filter accounts"
              />
            </Toolbar>
            <CardContent className="p-3 sm:p-4">
              <SectionError message={accountsError} />
              {accountLoading ? (
                <TableSkeleton rows={6} cols={3} />
              ) : (
                <DataTable
                  columns={accountColumns}
                  data={accounts ?? []}
                  pageSize={PAGE_SIZE}
                  page={accountPage}
                  totalPages={accountTotalPages}
                  onPageChange={(next) => {
                    setAccountPage(next);
                    setAccountLoading(true);
                  }}
                  emptyMessage={
                    accountQ
                      ? "No accounts match this filter."
                      : "This member has no accounts yet."
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="mt-4">
          <Card className="flex w-full shrink-0 flex-col overflow-hidden border-border/60 shadow-sm">
            <Toolbar>
              <FilterInput
                value={trQ}
                onChange={(value) => {
                  setTrQ(value);
                  setTrPage(1);
                  setTrLoading(true);
                }}
                placeholder="Filter transactions"
                label="Filter transactions"
              />
              <Select
                value={trPeriod}
                onValueChange={(value) => {
                  setTrPeriod(value);
                  setTrPage(1);
                  setTrLoading(true);
                }}
              >
                <SelectTrigger
                  aria-label="Filter by period"
                  className="h-9 w-40"
                >
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={6}>
                  <SelectItem value="all">All time</SelectItem>
                  {PERIODS.map(({ key, label }) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Toolbar>
            <CardContent className="p-3 sm:p-4">
              <SectionError message={transactionsError} />
              {trLoading ? (
                <TableSkeleton rows={6} cols={4} />
              ) : (
                <DataTable
                  columns={transactionColumns}
                  data={transactions ?? []}
                  pageSize={PAGE_SIZE}
                  page={trPage}
                  totalPages={trTotalPages}
                  onPageChange={(next) => {
                    setTrPage(next);
                    setTrLoading(true);
                  }}
                  emptyMessage={
                    trQ || trPeriod !== "all"
                      ? "No transactions match this filter."
                      : "No transactions yet."
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budgets */}
        <TabsContent value="budgets" className="mt-4">
          <Card className="flex w-full shrink-0 flex-col overflow-hidden border-border/60 shadow-sm">
            <Toolbar>
              <FilterInput
                value={buQ}
                onChange={(value) => {
                  setBuQ(value);
                  setBuPage(1);
                  setBuLoading(true);
                }}
                placeholder="Filter budgets"
                label="Filter budgets"
              />
              <Select
                value={buPeriod}
                onValueChange={(value) => {
                  setBuPeriod(value);
                  setBuPage(1);
                  setBuLoading(true);
                }}
              >
                <SelectTrigger
                  aria-label="Filter by period"
                  className="h-9 w-40"
                >
                  <SelectValue placeholder="All periods" />
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={6}>
                  {BUDGET_PERIODS.map(({ key, label }) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Toolbar>
            <CardContent className="p-3 sm:p-4">
              <SectionError message={budgetsError} />
              {buLoading ? (
                <TableSkeleton rows={6} cols={5} />
              ) : (
                <DataTable
                  columns={budgetColumns}
                  data={budgets ?? []}
                  pageSize={PAGE_SIZE}
                  page={buPage}
                  totalPages={buTotalPages}
                  onPageChange={(next) => {
                    setBuPage(next);
                    setBuLoading(true);
                  }}
                  emptyMessage={
                    buQ || buPeriod !== "all"
                      ? "No budgets match this filter."
                      : "No budgets yet."
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4">
          <Card className="flex w-full shrink-0 flex-col overflow-hidden border-border/60 shadow-sm">
            <Toolbar>
              <FilterInput
                value={caQ}
                onChange={(value) => {
                  setCaQ(value);
                  setCaPage(1);
                  setCaLoading(true);
                }}
                placeholder="Filter categories"
                label="Filter categories"
              />
              <Select
                value={caType}
                onValueChange={(value) => {
                  setCaType(value);
                  setCaPage(1);
                  setCaLoading(true);
                }}
              >
                <SelectTrigger aria-label="Filter by type" className="h-9 w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={6}>
                  {CATEGORY_TYPES.map(({ key, label }) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Toolbar>
            <CardContent className="p-3 sm:p-4">
              <SectionError message={categoriesError} />
              {caLoading ? (
                <TableSkeleton rows={6} cols={2} />
              ) : (
                <DataTable
                  columns={categoryColumns}
                  data={categories ?? []}
                  pageSize={PAGE_SIZE}
                  page={caPage}
                  totalPages={caTotalPages}
                  onPageChange={(next) => {
                    setCaPage(next);
                    setCaLoading(true);
                  }}
                  emptyMessage={
                    caQ || caType !== "all"
                      ? "No categories match this filter."
                      : "No categories yet."
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions */}
        <TabsContent value="subscriptions" className="mt-4">
          <Card className="flex w-full shrink-0 flex-col overflow-hidden border-border/60 shadow-sm">
            <Toolbar>
              <span className="text-sm text-muted-foreground">
                Current plan and status
              </span>
            </Toolbar>
            <CardContent className="p-3 sm:p-4">
              <SectionError message={subscriptionsError} />
              {subsLoading ? (
                <TableSkeleton rows={2} cols={4} />
              ) : (
                <DataTable
                  columns={subscriptionColumns}
                  data={subscriptions ?? []}
                  pageSize={PAGE_SIZE}
                  emptyMessage="No subscription on record."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserDetailPage;
