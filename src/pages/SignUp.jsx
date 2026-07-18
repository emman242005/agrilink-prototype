import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { sendEmail } from "../lib/sendEmail";
import bgImage from "../assets/images/pic1.png";

export default function SignUp() {
  const { t } = useTranslation();
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

    await sendEmail(
      form.email,
      form.name,
      "Welcome to AgriLink",
      "Your account has been created. Next, verify your identity so you can start applying for loans through your MFI."
    );

    navigate("/kyc");
  };

  if (awaitingVerification) {
    return (
      <AuthShell title={t("verify_email_title")} subtitle={t("verify_email_sub")}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gold/15 flex items-center justify-center mb-5">
            <span className="text-gold text-2xl">✉️</span>
          </div>
          <p className="text-sm text-sage mb-2">{t("sent_link_to")}</p>
          <p className="text-sm font-medium text-forest mb-6">{form.email}</p>
          <p className="text-sm text-sage mb-6">{t("click_link_then_login")}</p>
          <Link
            to="/login/farmer"
            className="block w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition text-center"
          >
            {t("go_to_login")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth_create_account")} subtitle={t("auth_signup_sub")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label={t("field_full_name")} value={form.name} onChange={update("name")} required />
        <Field label={t("field_email")} type="email" value={form.email} onChange={update("email")} required />
        <Field label={t("field_password")} type="password" value={form.password} onChange={update("password")} required minLength={6} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
        >
          {loading ? t("creating_account") : t("create_account_btn")}
        </button>
      </form>
      <p className="text-center text-sm text-sage mt-6">
        {t("already_have_account")}{" "}
        <Link to="/login/farmer" className="text-forest font-medium underline underline-offset-4">
          {t("log_in")}
        </Link>
      </p>
      <p className="text-center text-xs text-sage mt-3">
        <Link to="/signup" className="underline underline-offset-4">{t("not_farmer_switch")}</Link>
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