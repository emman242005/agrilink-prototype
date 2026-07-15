import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Field } from "./SignUp";

const DOC_FIELDS = [
  { key: "landDocument", label: "Land title, customary allocation, or lease agreement", required: true },
  { key: "farmSketch", label: "Farm location sketch / site map", required: true },
  { key: "farmPlan", label: "Farm plan / project proposal", required: true },
  { key: "farmRecord", label: "Farm record book (past sales/harvests)", required: false },
  { key: "coopLetter", label: "Cooperative (GIC) recommendation letter", required: false },
  { key: "idCard", label: "National Identity Card (CNI)", required: true },
  { key: "passbook", label: "CAMCCUL member passbook", required: true },
];

export default function Kyc() {
  const { session, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});

  const [form, setForm] = useState({
    fullName: profile?.full_name || "",
    phone: "",
    nationalId: "",
    region: "",
    crop: "",
    farmSize: "",
    cooperative: "",
    guarantor1Name: "",
    guarantor1Contact: "",
    guarantor2Name: "",
    guarantor2Contact: "",
    equipmentPledge: "",
  });

  const [files, setFiles] = useState({});

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const updateFile = (key) => (e) => {
    const file = e.target.files[0];
    if (file) setFiles({ ...files, [key]: file });
  };

  const uploadDoc = async (key, file) => {
    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/${key}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file);
    if (uploadError) throw new Error(`${key}: ${uploadError.message}`);
    return path;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    for (const doc of DOC_FIELDS) {
      if (doc.required && !files[doc.key]) {
        setError(`Please upload: ${doc.label}`);
        return;
      }
    }

    setLoading(true);
    try {
      const urls = {};
      for (const doc of DOC_FIELDS) {
        if (files[doc.key]) {
          setUploadStatus((s) => ({ ...s, [doc.key]: "uploading" }));
          urls[doc.key] = await uploadDoc(doc.key, files[doc.key]);
          setUploadStatus((s) => ({ ...s, [doc.key]: "done" }));
        }
      }

      const { error: kycError } = await supabase.from("kyc_submissions").insert({
        user_id: session.user.id,
        full_name: form.fullName,
        phone: form.phone,
        national_id: form.nationalId,
        region: form.region,
        crop: form.crop,
        farm_size: form.farmSize,
        cooperative: form.cooperative || null,
        land_document_url: urls.landDocument || null,
        farm_sketch_url: urls.farmSketch || null,
        farm_plan_url: urls.farmPlan || null,
        farm_record_url: urls.farmRecord || null,
        coop_letter_url: urls.coopLetter || null,
        id_card_url: urls.idCard || null,
        passbook_url: urls.passbook || null,
        guarantor1_name: form.guarantor1Name || null,
        guarantor1_contact: form.guarantor1Contact || null,
        guarantor2_name: form.guarantor2Name || null,
        guarantor2_contact: form.guarantor2Contact || null,
        equipment_pledge: form.equipmentPledge || null,
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
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="font-mono text-xs text-gold tracking-widest mb-2">IDENTITY VERIFICATION</p>
        <h1 className="font-display text-3xl font-semibold text-forest mb-2">Verify your identity</h1>
        <p className="text-sm text-sage mb-8">
          This information and these documents are reviewed by our lending partners before you can apply for a loan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Basic information">
            <Field label="Full name" value={form.fullName} onChange={update("fullName")} required />
            <Field label="Phone number" value={form.phone} onChange={update("phone")} required />
            <Field label="National ID number" value={form.nationalId} onChange={update("nationalId")} required />
            <Field label="Region" value={form.region} onChange={update("region")} placeholder="e.g. West Region, CM" required />
            <Field label="Primary crop" value={form.crop} onChange={update("crop")} required />
            <Field label="Farm size (ha)" value={form.farmSize} onChange={update("farmSize")} required />
            <Field label="Cooperative / GIC (if any)" value={form.cooperative} onChange={update("cooperative")} />
          </Section>

          <Section title="Land & farm ownership documents">
            <FileField field={DOC_FIELDS[0]} file={files.landDocument} status={uploadStatus.landDocument} onChange={updateFile("landDocument")} />
            <FileField field={DOC_FIELDS[1]} file={files.farmSketch} status={uploadStatus.farmSketch} onChange={updateFile("farmSketch")} />
          </Section>

          <Section title="Business & production documents">
            <FileField field={DOC_FIELDS[2]} file={files.farmPlan} status={uploadStatus.farmPlan} onChange={updateFile("farmPlan")} />
            <FileField field={DOC_FIELDS[3]} file={files.farmRecord} status={uploadStatus.farmRecord} onChange={updateFile("farmRecord")} />
            <FileField field={DOC_FIELDS[4]} file={files.coopLetter} status={uploadStatus.coopLetter} onChange={updateFile("coopLetter")} />
          </Section>

          <Section title="Proof of financial identity">
            <FileField field={DOC_FIELDS[5]} file={files.idCard} status={uploadStatus.idCard} onChange={updateFile("idCard")} />
            <FileField field={DOC_FIELDS[6]} file={files.passbook} status={uploadStatus.passbook} onChange={updateFile("passbook")} />
          </Section>

          <Section title="Guarantees & collateral">
            <Field label="Guarantor 1 — full name" value={form.guarantor1Name} onChange={update("guarantor1Name")} required />
            <Field label="Guarantor 1 — contact" value={form.guarantor1Contact} onChange={update("guarantor1Contact")} required />
            <Field label="Guarantor 2 — full name (optional)" value={form.guarantor2Name} onChange={update("guarantor2Name")} />
            <Field label="Guarantor 2 — contact (optional)" value={form.guarantor2Contact} onChange={update("guarantor2Contact")} />
            <label className="block">
              <span className="text-sm font-medium text-ink/80 mb-1.5 block">
                Equipment / livestock pledge (list what can serve as collateral)
              </span>
              <textarea
                value={form.equipmentPledge}
                onChange={update("equipmentPledge")}
                rows={3}
                placeholder="e.g. 1 tiller, 4 goats, 2 pigs"
                className="w-full border border-forest/20 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
              />
            </label>
          </Section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
          >
            {loading ? "Uploading and submitting…" : "Submit for verification"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-forest mb-4 pb-2 border-b border-forest/10">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function FileField({ field, file, status, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80 mb-1.5 block">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </span>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={onChange}
        required={field.required}
        className="w-full text-sm border border-forest/20 rounded-lg px-4 py-2.5 bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-forest/10 file:text-forest file:text-xs file:font-medium"
      />
      {file && (
        <p className="text-xs text-sage mt-1">
          {status === "uploading" ? "Uploading…" : status === "done" ? "✓ Uploaded" : file.name}
        </p>
      )}
    </label>
  );
}