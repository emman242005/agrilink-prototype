import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthShell, Field } from "./SignUp";
import { createAndSendOtp } from "../lib/otp";
import OtpVerifyModal from "../components/OtpVerifyModal";

export default function MfiLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "mfi_officer") {
      setLoading(false);
      setError("This account is not registered as an MFI.");
      await supabase.auth.signOut();
      return;
    }

    await createAndSendOtp(data.user.id, data.user.email, profile?.full_name);
    setLoading(false);
    setPendingUser({ id: data.user.id, email: data.user.email });
  };

  const handleVerified = () => {
    navigate("/mfi/pending");
  };

  const handleCancel = async () => {
    await supabase.auth.signOut();
    setPendingUser(null);
  };

  return (
    <AuthShell title="MFI Login" subtitle="Access your lending dashboard">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Field label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="text-center text-sm text-sage mt-6">
        New institution?{" "}
        <Link to="/mfi/signup" className="text-forest font-medium underline underline-offset-4">
          Register here
        </Link>
      </p>
      <p className="text-center text-xs text-sage mt-3">
        <Link to="/login" className="underline underline-offset-4">Not an MFI? Switch portal</Link>
      </p>

      {pendingUser && (
        <OtpVerifyModal
          userId={pendingUser.id}
          email={pendingUser.email}
          onVerified={handleVerified}
          onCancel={handleCancel}
        />
      )}
    </AuthShell>
  );
}