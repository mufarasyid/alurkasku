import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import CardHead from "../cards/parts/CardHead";
import CardBody from "../cards/parts/CardBody";
import CardFoot from "../cards/parts/CardFoot";

const CardDashboard = ({
  title,
  description,
  action,
  footer,
  className,
  descriptionClassName,
  children,
}) => (
  <Card className={cn("flex h-full flex-col p-5", className)}>
    <CardHead
      title={title}
      description={description}
      action={action}
      descriptionClassName={descriptionClassName}
    />
    <CardBody>{children}</CardBody>
    {footer && <CardFoot>{footer}</CardFoot>}
  </Card>
);

export default CardDashboard;
