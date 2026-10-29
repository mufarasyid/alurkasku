import CardDashboard from "../templates/CardDashboard";
import CardPlaceholder from "./parts/CardPlaceholder";

const IncomeSourcesCard = ({ className }) => (
  <CardDashboard
    className={className}
    title="Income Sources"
    description="Where the money comes from"
  >
    <CardPlaceholder>Source breakdown</CardPlaceholder>
  </CardDashboard>
);

export default IncomeSourcesCard;
