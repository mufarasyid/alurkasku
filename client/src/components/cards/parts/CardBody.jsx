import { cn } from "../../../lib/utils";

const CardBody = ({ className, children }) => (
  <div className={cn("mt-4 flex min-h-0 flex-1 flex-col", className)}>
    {children}
  </div>
);

export default CardBody;
