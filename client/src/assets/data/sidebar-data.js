import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ChartNoAxesCombined,
  PiggyBank,
  Tags,
  ReceiptText,
  Target,
  Settings,
} from "lucide-react";

export const sidebarData = [
  {
    title: "OVERVIEW",
    items: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Transactions",
        path: "/dashboard/transaction",
        icon: ArrowLeftRight,
      },
      {
        title: "Accounts",
        path: "/accounts",
        icon: Wallet,
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        title: "Budgets",
        path: "/budgets",
        icon: PiggyBank,
      },
      {
        title: "Categories",
        path: "/categories",
        icon: Tags,
      },
      {
        title: "Recurring",
        path: "/recurring",
        icon: ReceiptText,
      },
      {
        title: "Financial Goals",
        path: "/goals",
        icon: Target,
      },
    ],
  },
  {
    title: "INVESTMENTS",
    items: [
      {
        title: "Portfolio",
        path: "/investments",
        icon: ChartNoAxesCombined,
        children: [
          {
            title: "Overview",
            path: "/investments",
          },
          {
            title: "Stocks",
            path: "/investments/stocks",
          },
          {
            title: "Mutual Funds",
            path: "/investments/mutual-funds",
          },
          {
            title: "Gold",
            path: "/investments/gold",
          },
        ],
      },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      {
        title: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default sidebarData;
