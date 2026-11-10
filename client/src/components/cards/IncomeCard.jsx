import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";
import CardPlaceholder from "./parts/CardPlaceholder";

const IncomeCard = ({ className }) => (
  <CardDashboard
    className={cn("border-gold/40 bg-accent text-primary", className)}
    descriptionClassName="text-primary/70"
    footer={<span className="text-primary/70">This month</span>}
    title="Income"
    description="Money in this month"
  >
    <CardPlaceholder className="border-gold/50 text-primary/70">
      Income summary
    </CardPlaceholder>
  </CardDashboard>
);

export default IncomeCard;
