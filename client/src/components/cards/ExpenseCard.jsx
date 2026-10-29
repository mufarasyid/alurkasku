import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";
import CardPlaceholder from "./parts/CardPlaceholder";

const ExpenseCard = ({ className }) => (
  <CardDashboard
    className={cn(
      "border-slate-300 bg-slate-200 text-slate-950",
      className,
    )}
    descriptionClassName="text-slate-600"
    footer={<span className="text-slate-600">This month</span>}
    title="Expenses"
    description="Spending by category"
  >
    <CardPlaceholder className="border-slate-400/70 text-slate-600">
      Expense breakdown
    </CardPlaceholder>
  </CardDashboard>
);

export default ExpenseCard;
