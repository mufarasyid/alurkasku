import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import CardDashboard from "../templates/CardDashboard";
import { EllipsisVertical, Funnel, Search } from "lucide-react";

const ActivityTransactionCard = ({ className }) => (
  <CardDashboard
    className={cn("border-slate-300 text-slate-950", className)}
    title="Activity Transactions"
    action={
      <div className="flex gap-2">
        <div className="relative">
          <Search
            size={17}
            strokeWidth={1.8}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            type="text"
            placeholder="Search transactions"
            className="w-full pl-9 sm:w-55"
          />
        </div>

        <Button variant="outline">
          <Funnel size={19} strokeWidth={1.8} />
          <p>Filter</p>
        </Button>

        <Button variant="outline" size="icon">
          <EllipsisVertical size={17} className="text-slate-600" />
        </Button>
      </div>
    }
  />
);

export default ActivityTransactionCard;
