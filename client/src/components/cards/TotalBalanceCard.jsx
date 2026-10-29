import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import CardBody from "./parts/CardBody";

const TotalBalanceCard = ({ className }) => (
  <Card
    className={cn(
      "flex h-full flex-col border-cyan-600/30 bg-linear-to-br from-cyan-300 via-cyan-400 to-cyan-500 p-5 text-cyan-950",
      className,
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold">Total Balance</h2>

        <p className="mt-0.5 line-clamp-2 text-xs text-cyan-950/80">
          Across all accounts
        </p>
      </div>
    </div>

    <CardBody>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-cyan-950/25 text-xs text-cyan-950/80">
        Balance summary
      </div>
    </CardBody>
  </Card>
);

export default TotalBalanceCard;
