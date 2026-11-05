import { BanknoteArrowDown } from "lucide-react";
import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";
import CardPlaceholder from "./parts/CardPlaceholder";

const IncomeTransactionCard = ({ className }) => (
  <CardDashboard
    className={cn("border-slate-300 text-slate-950", className)}
    footer={
      <div className="flex gap-1">
        <p className="text-slate-600">from last month</p>
      </div>
    }
    title={
      <div className="flex items-center gap-2">
        <BanknoteArrowDown size={17} className="text-slate-600" />
        <span>Incomes</span>
      </div>
    }
  >
    <CardPlaceholder className="border-slate-400/70 text-slate-600">
      Total income summary
    </CardPlaceholder>
  </CardDashboard>
);

export default IncomeTransactionCard;
