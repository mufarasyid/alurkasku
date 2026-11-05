import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";
import CardPlaceholder from "./parts/CardPlaceholder";

const TotalTransactionCard = ({ className }) => (
  <CardDashboard
    className={cn("border-slate-300 text-slate-950", className)}
    footer={
      <div className="flex gap-1">
        <p className="text-slate-600">from last month</p>
      </div>
    }
    title="Total Transaction"
  >
    <CardPlaceholder className="border-slate-400/70 text-slate-600">
      Total transaction summary
    </CardPlaceholder>
  </CardDashboard>
);

export default TotalTransactionCard;
