import { Navigate, Route, Routes } from "react-router-dom";
import { LayoutDashboard, Users, Building2, UserCircle, Briefcase, ArrowDownToLine, TrendingUp, Home, BarChart } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import BrokerManagement from "./pages/superadmin/BrokerManagement";
import SuperAdminUserManagement from "./pages/superadmin/UserManagement";
import SuperAdminTrades from "./pages/superadmin/Trades";
import SuperAdminProfile from "./pages/superadmin/Profile";
import BrokerDashboard from "./pages/broker/Dashboard";
import BrokerUserManagement from "./pages/broker/UserManagement";
import BrokerWithdrawals from "./pages/broker/Withdrawals";
import BrokerProfile from "./pages/broker/Profile";
import UserHome from "./pages/user/Home";
import UserPortfolio from "./pages/user/Portfolio";
import UserOrderHistory from "./pages/user/OrderHistory";
import UserProfile from "./pages/user/Profile";
import { UserAppShell } from "./components/user/UserAppShell";

const superAdminNav = [
  { to: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/superadmin/brokers", label: "Brokers", icon: Building2 },
  { to: "/superadmin/users", label: "Users", icon: Users },
  { to: "/superadmin/trades", label: "Trades", icon: TrendingUp },
  { to: "/superadmin/profile", label: "Profile", icon: UserCircle },
];

const brokerNav = [
  { to: "/broker", label: "Dashboard", icon: LayoutDashboard },
  { to: "/broker/users", label: "Users", icon: Users },
  { to: "/broker/withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
  { to: "/broker/profile", label: "Profile", icon: UserCircle },
];

const userNav = [
  { to: "/user/home", label: "Home", icon: Home },
  {
    to: "/user/watchlist",
    label: "Research",
    icon: BarChart,
    externalUrl: "https://in.tradingview.com/markets/currencies/",
  },
  { to: "/user/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/user/profile", label: "Profile", icon: UserCircle },
];

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const paths: Record<string, string> = {
    superadmin: "/superadmin",
    broker: "/broker",
    user: "/user/home",
  };
  return <Navigate to={paths[user.role]} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute roles={["superadmin"]} />}>
        <Route
          element={<AppShell navItems={superAdminNav} />}
        >
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/brokers" element={<BrokerManagement />} />
          <Route path="/superadmin/users" element={<SuperAdminUserManagement />} />
          <Route path="/superadmin/trades" element={<SuperAdminTrades />} />
          <Route path="/superadmin/profile" element={<SuperAdminProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["broker"]} />}>
        <Route element={<AppShell navItems={brokerNav} />}>
          <Route path="/broker" element={<BrokerDashboard />} />
          <Route path="/broker/users" element={<BrokerUserManagement />} />
          <Route path="/broker/withdrawals" element={<BrokerWithdrawals />} />
          <Route path="/broker/profile" element={<BrokerProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["user"]} />}>
        <Route element={<UserAppShell navItems={userNav} />}>
          <Route path="/user" element={<Navigate to="/user/home" replace />} />
          <Route path="/user/home" element={<UserHome />} />
          <Route path="/user/portfolio" element={<UserPortfolio />} />
          <Route path="/user/order-history" element={<UserOrderHistory />} />
          <Route path="/user/wallet" element={<Navigate to="/user/profile" replace />} />
          <Route path="/user/add-money" element={<Navigate to="/user/home" replace />} />
          <Route path="/user/profile" element={<UserProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
