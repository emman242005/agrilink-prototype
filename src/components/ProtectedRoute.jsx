import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isOtpVerified } from "../lib/otp";
import { supabase } from "../lib/supabaseClient";

export function RequireFarmer({ children }) {
  const { session, profile, loading, signOut } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session && !isOtpVerified(session.user.id)) {
      signOut().then(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, [loading, session]);

  if (loading || !checked) return <CenteredLoading />;
  if (!session) return <Navigate to="/login/farmer" replace />;
  if (profile?.role !== "farmer") return <Navigate to="/login/farmer" replace />;
  if (!isOtpVerified(session.user.id)) return <Navigate to="/login/farmer" replace />;
  return children;
}

export function RequireKycStatus({ statuses, children }) {
  const { profile, loading } = useAuth();
  if (loading) return <CenteredLoading />;
  if (!profile) return <CenteredLoading />;

  const allowed = Array.isArray(statuses) ? statuses : [statuses];

  if (!allowed.includes(profile.kyc_status)) {
    if (profile.kyc_status === "not_submitted" || profile.kyc_status === "denied") {
      return <Navigate to="/kyc" replace />;
    }
    if (profile.kyc_status === "pending") return <Navigate to="/pending" replace />;
    if (profile.kyc_status === "approved") return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { session, profile, loading, signOut } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session && !isOtpVerified(session.user.id)) {
      signOut().then(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, [loading, session]);

  if (loading || !checked) return <CenteredLoading />;
  if (!session || profile?.role !== "admin") return <Navigate to="/control-x9k2/login" replace />;
  if (!isOtpVerified(session.user.id)) return <Navigate to="/control-x9k2/login" replace />;
  return children;
}

export function RequireMfiOfficer({ children }) {
  const { session, profile, loading, signOut } = useAuth();
  const [checked, setChecked] = useState(false);
  const [mfiStatus, setMfiStatus] = useState(null);

  useEffect(() => {
    const run = async () => {
      if (loading) return;
      if (session && !isOtpVerified(session.user.id)) {
        await signOut();
        setChecked(true);
        return;
      }
      if (session && profile?.role === "mfi_officer" && profile?.mfi_id) {
        const { data } = await supabase
          .from("mfis")
          .select("status")
          .eq("id", profile.mfi_id)
          .single();
        setMfiStatus(data?.status || null);
      }
      setChecked(true);
    };
    run();
  }, [loading, session, profile]);

  if (loading || !checked) return <CenteredLoading />;
  if (!session || profile?.role !== "mfi_officer") return <Navigate to="/mfi/login" replace />;
  if (!isOtpVerified(session.user.id)) return <Navigate to="/mfi/login" replace />;
  if (mfiStatus !== "approved") return <Navigate to="/mfi/pending" replace />;
  return children;
}

function CenteredLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <p className="font-mono text-sm text-sage">Loading...</p>
    </div>
  );
}