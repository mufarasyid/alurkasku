import { Route, Routes } from "react-router";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardLayout from "./components/layouts/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import TransactionPage from "./pages/dashboard/TransactionPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import CategoriesPage from "./pages/dashboard/CategoriesPage";
import AccountsPage from "./pages/dashboard/AccountsPage";
import BudgetsPage from "./pages/dashboard/BudgetsPage";
import PatunganPage from "./pages/dashboard/PatunganPage";
import PatunganDetailPage from "./pages/dashboard/PatunganDetailPage";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transaction" element={<TransactionPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="patungan" element={<PatunganPage />} />
          <Route path="patungan/:id" element={<PatunganDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
