import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Field } from "./SignUp";
import { Upload, Check, FileText } from "lucide-react";
import bgImage from "../assets/images/pic2.png";

export default function Kyc() {
  const { session, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);

  const [form, setForm] = useState({
    fullName: profile?.full_name || "",
    phone: "",
    age: "",
    yearOfBirth: "",
    region: "",
  });

  useEffect(() => {
    const loadLastSubmission = async () => {
      if (profile?.kyc_status === "denied") {
        const { data } = await supabase
          .from("kyc_submissions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .single();
        setLastSubmission(data);
      }
    };
    if (profile) loadLastSubmission();
  }, [profile, session]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!idCardFile) {
      setError("Please upload a photo of your National Identity Card.");
      return;
    }

    setLoading(true);
    try {
      const ext = idCardFile.name.split(".").pop();
      const path = `${session.user.id}/kyc/id-card-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, idCardFile);
      if (uploadError) throw new Error(uploadError.message);

      const { error: kycError } = await supabase.from("kyc_submissions").insert({
        user_id: session.user.id,
        full_name: form.fullName,
        phone: form.phone,
        age: form.age ? Number(form.age) : null,
        year_of_birth: form.yearOfBirth ? Number(form.yearOfBirth) : null,
        region: form.region,
        id_card_url: path,
      });

      if (kycError) throw new Error(kycError.message);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ kyc_status: "pending" })
        .eq("id", session.user.id);

      if (profileError) throw new Error(profileError.message);

      refreshProfile();
      navigate("/pending");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(rgba(250, 249, 246, 0.45), rgba(250, 249, 246, 0.55)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="px-6 py-10">
        <div className="max-w-md mx-auto">
          {profile?.kyc_status === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
              <p className="font-mono text-xs text-red-600 tracking-widest mb-2">VERIFICATION NOT APPROVED</p>
              <h2 className="font-display text-lg font-semibold text-red-700 mb-2">
                Your previous submission was not approved
              </h2>
              <p className="text-sm text-red-700/80 mb-2">Please review your details below, then resubmit.</p>
              {lastSubmission?.review_note && (
                <div className="bg-white/60 rounded-lg p-3 mt-3">
                  <p className="text-xs text-red-600 font-medium mb-1">Reason from your MFI:</p>
                  <p className="text-sm text-red-700">{lastSubmission.review_note}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white/95 rounded-2xl p-8 shadow-sm">
            <p className="font-mono text-xs text-gold tracking-widest mb-2">IDENTITY VERIFICATION</p>
            <h1 className="font-display text-3xl font-semibold text-forest mb-2">Verify your identity</h1>
            <p className="text-sm text-sage mb-8">
              Confirm who you are with your basic details and a photo of your ID. You'll submit farm and loan documents later, when you apply for a loan.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Full name" value={form.fullName} onChange={update("fullName")} required />
              <Field label="Phone number" value={form.phone} onChange={update("phone")} required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" type="number" value={form.age} onChange={update("age")} required />
                <Field label="Year of birth" type="number" value={form.yearOfBirth} onChange={update("yearOfBirth")} placeholder="e.g. 1985" required />
              </div>
              <Field label="Region" value={form.region} onChange={update("region")} placeholder="e.g. West Region, CM" required />

              <IdCardDropzone file={idCardFile} onChange={setIdCardFile} />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
              >
                {loading ? "Submitting..." : profile?.kyc_status === "denied" ? "Resubmit for verification" : "Submit for verification"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function IdCardDropzone({ file, onChange }) {
  const [dragging, setDragging] = useState(false);
  return (
    <label>
      <span className="text-sm font-medium text-ink/80 mb-1.5 block">
        National Identity Card (CNI) <span className="text-red-500">*</span>
      </span>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onChange(f); }}
        className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl py-6 cursor-pointer transition ${
          dragging ? "border-forest bg-mint/10" : file ? "border-forest/40 bg-forest/5" : "border-forest/20 hover:bg-forest/5"
        }`}
      >
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files[0] && onChange(e.target.files[0])} />
        {file ? (
          <>
            <Check size={18} className="text-forest" />
            <span className="text-sm text-forest font-medium">{file.name}</span>
          </>
        ) : (
          <>
            <FileText size={20} className="text-sage" />
            <span className="text-sm text-ink/70 font-medium">Upload a clear photo of your ID</span>
            <span className="text-xs text-sage flex items-center gap-1"><Upload size={12} /> Drop file or click to browse</span>
          </>
        )}
      </div>
    </label>
  );
}