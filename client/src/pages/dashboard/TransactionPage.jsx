
import { Calendar, Download, Plus } from "lucide-react";

import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import {
  ActivityTransactionCard,
  ExpenseTransactionCard,
  IncomeTransactionCard,
  SubscriptionTransactionCard,
  TotalTransactionCard,
} from "../../components/cards";

import ExpenseBreakdownTransactionCard from "../../components/cards/ExpenseBreakdownTransactionCard";

// Reusable responsive card wrapper
const GridCard = ({ className, children }) => (
  <div
    className={cn(
      "flex min-w-0 flex-col",
      "[&>*]:min-h-0 [&>*]:flex-1",
      className
    )}
  >
    {children}
  </div>
);

const TransactionPage = () => {
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

          <Select>
            <SelectTrigger className="w-full min-w-[160px] sm:w-[180px]">
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
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex-1 sm:flex-none">
            <Download size={19} strokeWidth={1.8} />
            Export
          </Button>

          <Button variant="default" className="flex-1 sm:flex-none">
            <Plus size={19} strokeWidth={1.8} />
            Add Transaction
          </Button>

        </div>
      </div>

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
          <TotalTransactionCard />
          <IncomeTransactionCard />
          <ExpenseTransactionCard />
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
          <ExpenseBreakdownTransactionCard />
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
          <ActivityTransactionCard />
        </GridCard>

        {/* Subscription */}
        <GridCard
          className="
            min-h-[300px]
            sm:col-span-2
            lg:col-span-4
          "
        >
          <SubscriptionTransactionCard />
        </GridCard>

      </div>
    </div>
  );
};

export default TransactionPage;
