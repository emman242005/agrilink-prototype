import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireFarmer({ children }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <CenteredLoading />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role !== "farmer") return <Navigate to="/login" replace />;
  return children;
}

export function RequireKycStatus({ status, children }) {
  const { profile, loading } = useAuth();
  if (loading) return <CenteredLoading />;
  if (!profile) return <CenteredLoading />;

  if (profile.kyc_status !== status) {
    if (profile.kyc_status === "not_submitted" || profile.kyc_status === "denied")
      return <Navigate to="/kyc" replace />;
    if (profile.kyc_status === "pending") return <Navigate to="/pending" replace />;
    if (profile.kyc_status === "approved") return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <CenteredLoading />;
  if (!session || profile?.role !== "admin")
    return <Navigate to="/control-x9k2/login" replace />;
  return children;
}

function CenteredLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <p className="font-mono text-sm text-sage">Loading…</p>
    </div>
  );
}