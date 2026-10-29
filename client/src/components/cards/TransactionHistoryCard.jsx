import CardDashboard from "../templates/CardDashboard";
import CardPlaceholder from "./parts/CardPlaceholder";

const TransactionHistoryCard = ({ className }) => (
  <CardDashboard
    className={className}
    title="Transactions History"
    description="Latest activity"
  >
    <CardPlaceholder>Transaction list</CardPlaceholder>
  </CardDashboard>
);

export default TransactionHistoryCard;
