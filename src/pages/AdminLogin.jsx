import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Field } from "./SignUp";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      .select("role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    if (profile?.role !== "admin") {
      setError("This account does not have admin access.");
      await supabase.auth.signOut();
      return;
    }

    navigate("/control-x9k2");
  };

  return (
    <div className="min-h-screen bg-forestdark flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <p className="font-mono text-xs text-gold tracking-widest text-center mb-2">
          RESTRICTED ACCESS
        </p>
        <h1 className="font-display text-xl font-semibold text-paper text-center mb-8">
          MFI Control Centre
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <span className="text-sm font-medium text-paper/80 mb-1.5 block">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border border-paper/20 rounded-lg px-4 py-2.5 bg-forest/40 text-paper focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <div>
            <span className="text-sm font-medium text-paper/80 mb-1.5 block">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full border border-paper/20 rounded-lg px-4 py-2.5 bg-forest/40 text-paper focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-forestdark font-medium py-3 rounded-lg hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}