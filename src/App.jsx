import { Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Kyc from "./pages/Kyc";
import Pending from "./pages/Pending";
import FarmerDashboard from "./pages/FarmerDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminControlCentre from "./pages/AdminControlCentre";
import { RequireFarmer, RequireKycStatus, RequireAdmin } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/kyc"
        element={
          <RequireFarmer>
            <RequireKycStatus statuses={["not_submitted", "denied"]}>
              <Kyc />
            </RequireKycStatus>
          </RequireFarmer>
        }
      />
      <Route
        path="/pending"
        element={
          <RequireFarmer>
            <RequireKycStatus statuses={["pending"]}>
              <Pending />
            </RequireKycStatus>
          </RequireFarmer>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireFarmer>
            <RequireKycStatus statuses={["approved"]}>
              <FarmerDashboard />
            </RequireKycStatus>
          </RequireFarmer>
        }
      />

      {/* Hidden admin path — not linked anywhere in the UI */}
      <Route path="/control-x9k2/login" element={<AdminLogin />} />
      <Route
        path="/control-x9k2"
        element={
          <RequireAdmin>
            <AdminControlCentre />
          </RequireAdmin>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}