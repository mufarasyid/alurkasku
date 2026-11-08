import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ChartNoAxesCombined,
  PiggyBank,
  Tags,
  Settings,
  Users,
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
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        title: "Accounts",
        path: "/dashboard/accounts",
        icon: Wallet,
      },
      {
        title: "Categories",
        path: "/dashboard/categories",
        icon: Tags,
      },
      {
        title: "Budgets",
        path: "/dashboard/budgets",
        icon: PiggyBank,
      },
      {
        title: "Patungan",
        path: "/dashboard/patungan",
        icon: Users,
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
        path: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];

export default sidebarData;
