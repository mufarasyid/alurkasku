import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";
import CardBody from "./parts/CardBody";
import DeltaFooter from "./parts/DeltaFooter";
import { Skeleton } from "../ui/skeleton";
import { formatIDR } from "../../lib/format";

const ExpenseTransactionCard = ({ data, isLoading, className }) => (
  <CardDashboard
    className={cn("border-slate-300 text-slate-950", className)}
    footer={<DeltaFooter deltaPct={data?.delta_pct} />}
    title={
      <div className="flex items-center gap-2">
        <ArrowUpRight size={17} className="text-slate-600" aria-hidden="true" />
        <span>Expenses</span>
      </div>
    }
    description="Money out this period"
  >
    <CardBody>
      {isLoading ? (
        <div className="flex flex-1 flex-col justify-center gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-1">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {formatIDR(data?.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data?.count ?? 0} transactions
          </p>
        </div>
      )}
    </CardBody>
  </CardDashboard>
);

export default ExpenseTransactionCard;
