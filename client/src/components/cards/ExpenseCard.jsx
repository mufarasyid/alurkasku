import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";
import CardPlaceholder from "./parts/CardPlaceholder";

const ExpenseCard = ({ className }) => (
  <CardDashboard
    className={cn(
      "border-primary/15 bg-[#eef0f6] text-primary",
      className,
    )}
    descriptionClassName="text-primary/70"
    footer={<span className="text-primary/70">This month</span>}
    title="Expenses"
    description="Spending by category"
  >
    <CardPlaceholder className="border-primary/20 text-primary/70">
      Expense breakdown
    </CardPlaceholder>
  </CardDashboard>
);

export default ExpenseCard;
