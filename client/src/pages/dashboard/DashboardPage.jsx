import { Download, Plus, SlidersHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  ExpenseCard,
  IncomeCard,
  IncomeSourcesCard,
  MoneyFlowCard,
  TotalBalanceCard,
  TransactionHistoryCard,
} from "../../components/cards";

const GridCard = ({ className, children }) => (
  <div
    className={cn(
      "flex min-h-42 max-h-72 flex-col *:min-h-0 *:flex-1 md:max-h-80 lg:max-h-none",
      className,
    )}
  >
    {children ?? <Card />}
  </div>
);

const DashboardPage = () => {
  return (
    <div className="flex w-full flex-col gap-6 md:min-h-0 md:flex-1">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold lg:text-3xl">
            Dashboard Overview
          </h1>

          <p className="text-sm text-muted-foreground">Welcome back, John!</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <Button variant="outline" size="icon">
            <SlidersHorizontal size={19} strokeWidth={1.8} />
          </Button>

          <Button variant="outline" size="icon">
            <Download size={19} strokeWidth={1.8} />
          </Button>

          <Button variant="default" size="icon">
            <Plus size={19} strokeWidth={1.8} />
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-8 lg:grid-rows-8">
        {/* Card 1 */}
        <GridCard className="sm:col-span-2 lg:col-span-3 lg:row-span-4">
          <TotalBalanceCard />
        </GridCard>

        {/* Card 2 */}
        <GridCard className="lg:col-span-2 lg:col-start-4 lg:row-span-2">
          <IncomeCard />
        </GridCard>

        {/* Card 3 */}
        <GridCard className="lg:col-span-2 lg:col-start-4 lg:row-start-3 lg:row-span-2">
          <ExpenseCard />
        </GridCard>

        {/* Card 4 */}
        <GridCard className="sm:col-span-2 lg:col-span-3 lg:col-start-6 lg:row-start-1 lg:row-span-4">
          <TransactionHistoryCard />
        </GridCard>

        {/* Card 5 */}
        <GridCard className="sm:col-span-2 lg:col-span-5 lg:row-start-5 lg:row-span-4">
          <MoneyFlowCard />
        </GridCard>

        {/* Card 6 */}
        <GridCard className="sm:col-span-2 lg:col-span-3 lg:col-start-6 lg:row-start-5 lg:row-span-4">
          <IncomeSourcesCard />
        </GridCard>
      </div>
    </div>
  );
};

export default DashboardPage;
