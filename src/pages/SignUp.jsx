import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function SignUp() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role: "farmer" },
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/kyc");
  };

  return (
    <AuthShell title="Create your account" subtitle="Start your loan application in a few minutes">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Full name" value={form.name} onChange={update("name")} required />
        <Field label="Email" type="email" value={form.email} onChange={update("email")} required />
        <Field label="Password" type="password" value={form.password} onChange={update("password")} required minLength={6} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-sage mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-forest font-medium underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <span className="font-display text-2xl font-semibold text-forest">AgriLink</span>
          <h1 className="font-display text-xl font-semibold text-ink mt-4">{title}</h1>
          {subtitle && <p className="text-sm text-sage mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, type = "text", placeholder, required, minLength }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80 mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full border border-forest/20 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
      />
    </label>
  );
}