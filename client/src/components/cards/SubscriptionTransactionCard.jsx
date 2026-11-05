import { cn } from "../../lib/utils";
import CardDashboard from "../templates/CardDashboard";

const SubscriptionTransactionCard = ({ className }) => (
  <CardDashboard
    className={cn("border-slate-300 text-slate-950", className)}
    title="Subscriptions"
  ></CardDashboard>
);

export default SubscriptionTransactionCard;
