import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthShell, Field } from "./SignUp";
import { logLoginLocation } from "../lib/logLoginLocation";
import { createAndSendOtp } from "../lib/otp";
import OtpVerifyModal from "../components/OtpVerifyModal";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

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
      .select("full_name")
      .eq("id", data.user.id)
      .single();

    await createAndSendOtp(data.user.id, data.user.email, profile?.full_name);
    setLoading(false);
    setPendingUser({ id: data.user.id, email: data.user.email });
  };

  const handleVerified = () => {
    if (pendingUser) logLoginLocation(pendingUser.id);
    navigate("/kyc");
  };

  const handleCancel = async () => {
    await supabase.auth.signOut();
    setPendingUser(null);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your application">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" type="email" value={form.email} onChange={update("email")} required />
        <Field label="Password" type="password" value={form.password} onChange={update("password")} required />
        <p className="text-right -mt-2">
         <Link to="/forgot-password" className="text-xs text-sage hover:text-forest underline underline-offset-4">
           Forgot password?
         </Link>
        </p>
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
        New here?{" "}
        <Link to="/signup" className="text-forest font-medium underline underline-offset-4">
          Create an account
        </Link>
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