import CardDashboard from "../templates/CardDashboard";
import CardPlaceholder from "./parts/CardPlaceholder";

const MoneyFlowCard = ({ className }) => (
  <CardDashboard
    className={className}
    title="Money Flow"
    description="Income against expenses"
  >
    <CardPlaceholder>Cash flow chart</CardPlaceholder>
  </CardDashboard>
);

export default MoneyFlowCard;
