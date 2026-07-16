import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthShell, Field } from "./SignUp";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="We sent you a password reset link">
        <p className="text-sm text-sage text-center mb-6">
          If an account exists for {email}, a link to reset your password has been sent. It expires in 1 hour.
        </p>
        <Link
          to="/login"
          className="block w-full text-center bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition"
        >
          Back to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="text-center text-sm text-sage mt-6">
        <Link to="/login" className="text-forest font-medium underline underline-offset-4">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}