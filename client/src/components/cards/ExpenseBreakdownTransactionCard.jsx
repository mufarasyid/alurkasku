import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";

const ExpenseBreakdownTransactionCard = ({ className }) => (
  <CardDashboard
    className={cn("border-slate-300 text-slate-950", className)}
    title="Expense Breakdown"
  ></CardDashboard>
);

export default ExpenseBreakdownTransactionCard;
