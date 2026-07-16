import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import bgImage from "../assets/images/pic1.png";

export default function SignUp() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
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

    if (!data.session) {
      setAwaitingVerification(true);
      return;
    }

    navigate("/kyc");
  };

  if (awaitingVerification) {
    return (
      <AuthShell title="Verify your email" subtitle="One more step to activate your account">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gold/15 flex items-center justify-center mb-5">
            <span className="text-gold text-2xl">✉️</span>
          </div>
          <p className="text-sm text-sage mb-2">We sent a verification link to</p>
          <p className="text-sm font-medium text-forest mb-6">{form.email}</p>
          <p className="text-sm text-sage mb-6">
            Click the link in that email to activate your account, then come back here and log in.
          </p>
          <Link
            to="/login"
            className="block w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition text-center"
          >
            Go to login
          </Link>
        </div>
      </AuthShell>
    );
  }

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
          {loading ? "Creating account..." : "Create account"}
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
    <div
      className="min-h-screen flex items-center justify-center px-6 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 42, 30, 0.55), rgba(15, 42, 30, 0.75)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-sm w-full relative">
        <div className="text-center mb-8">
          <span className="font-display text-2xl font-semibold text-paper">AgriLink</span>
          <h1 className="font-display text-xl font-semibold text-paper mt-4">{title}</h1>
          {subtitle && <p className="text-sm text-paper/70 mt-1">{subtitle}</p>}
        </div>
        <div className="bg-paper rounded-2xl p-6 shadow-xl">{children}</div>
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