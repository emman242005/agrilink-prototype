import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthShell, Field } from "./SignUp";

export default function MfiSignUp() {
  const [form, setForm] = useState({
    contactName: "", email: "", password: "",
    mfiName: "", region: "", phone: "", description: "",
  });
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
        data: { full_name: form.contactName, role: "mfi_officer" },
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (!data.session) {
      setLoading(false);
      setAwaitingVerification(true);
      return;
    }

    await finishRegistration(data.user.id);
  };

  const finishRegistration = async (userId) => {
    const { data: mfi, error: mfiError } = await supabase
      .from("mfis")
      .insert({
        name: form.mfiName,
        region: form.region,
        contact_email: form.email,
        contact_phone: form.phone,
        description: form.description,
        owner_id: userId,
      })
      .select()
      .single();

    setLoading(false);
    if (mfiError) {
      setError(mfiError.message);
      return;
    }

    await supabase.from("profiles").update({ mfi_id: mfi.id }).eq("id", userId);
    navigate("/mfi/pending");
  };

  if (awaitingVerification) {
    return (
      <AuthShell title="Verify your email" subtitle="One more step to activate your MFI account">
        <div className="text-center">
          <p className="text-sm text-sage mb-2">We sent a verification link to</p>
          <p className="text-sm font-medium text-forest mb-6">{form.email}</p>
          <p className="text-sm text-sage mb-6">
            Click the link in that email, then log in to complete your MFI registration.
          </p>
          <Link to="/mfi/login" className="block w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition text-center">
            Go to MFI login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Register your MFI" subtitle="Join AgriLink as a lending partner">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Institution name" value={form.mfiName} onChange={update("mfiName")} required />
        <Field label="Region" value={form.region} onChange={update("region")} placeholder="e.g. Northwest Region, CM" required />
        <Field label="Brief description (optional)" value={form.description} onChange={update("description")} placeholder="What your institution does" />
        <div className="border-t border-forest/10 pt-5">
          <p className="text-xs font-medium text-sage mb-3">PRIMARY CONTACT</p>
          <div className="space-y-5">
            <Field label="Contact full name" value={form.contactName} onChange={update("contactName")} required />
            <Field label="Contact phone" value={form.phone} onChange={update("phone")} required />
            <Field label="Email" type="email" value={form.email} onChange={update("email")} required />
            <Field label="Password" type="password" value={form.password} onChange={update("password")} required minLength={6} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Register institution"}
        </button>
      </form>
      <p className="text-center text-sm text-sage mt-6">
        Already registered?{" "}
        <Link to="/mfi/login" className="text-forest font-medium underline underline-offset-4">
          Log in
        </Link>
      </p>
      <p className="text-center text-xs text-sage mt-3">
        <Link to="/signup" className="underline underline-offset-4">Not an MFI? Switch portal</Link>
      </p>
    </AuthShell>
  );
}