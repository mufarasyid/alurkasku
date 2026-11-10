import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import CardBody from "./parts/CardBody";

const TotalBalanceCard = ({ className }) => (
  <Card
    className={cn(
      "flex h-full flex-col border-primary bg-linear-to-br from-[#0a1e3f] via-primary to-[#010b1d] p-5 text-white shadow-md",
      className,
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-gold">
          Total Balance
        </h2>

        <p className="mt-0.5 line-clamp-2 text-xs text-white/60">
          Across all accounts
        </p>
      </div>
    </div>

    <CardBody>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-white/60">
        Balance summary
      </div>
    </CardBody>
  </Card>
);

export default TotalBalanceCard;
