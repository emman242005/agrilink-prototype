import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin, Wheat, Wallet, Calendar, Upload, Check,
  ChevronRight, ChevronLeft, X, FileImage, FileText,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { sendEmail } from "../lib/sendEmail";

const DURATIONS = [6, 12, 18];
const ESTIMATED_RATE = 12;

export default function LoanApplicationWizard({ userId, userEmail, userName, mfiId, mfiName, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const PURPOSES = [
    { key: "Seeds", label: t("purpose_seeds") },
    { key: "Irrigation", label: t("purpose_irrigation") },
    { key: "Machinery", label: t("purpose_machinery") },
    { key: "Fertilizer", label: t("purpose_fertilizer") },
    { key: "Other", label: t("purpose_other") },
  ];

  const DOC_FIELDS = {
    landDocument: { label: "Land title, customary allocation, or lease agreement", required: true },
    farmSketch: { label: "Farm location sketch / site map", required: true },
    farmPlan: { label: "Farm plan / project proposal", required: true },
    farmRecord: { label: "Farm record book (past sales / harvests)", required: false },
    coopLetter: { label: "Cooperative (GIC) recommendation letter", required: false },
    passbook: { label: "Savings passbook", required: true },
    collateralOwnership: { label: "Proof of ownership of the pledged collateral", required: true },
    guarantorConsent: { label: "Signed statement of guarantor's consent to act as surety", required: true },
    guarantorId: { label: "Guarantor's national ID", required: true },
  };

  const [form, setForm] = useState({
    farmSize: "", location: "", cropType: "", estimatedYield: "",
    amount: "", purpose: "", duration: 12,
    cooperative: "",
    guarantor1Name: "", guarantor1Contact: "",
    guarantor2Name: "", guarantor2Contact: "",
    equipmentPledge: "",
  });
  const [files, setFiles] = useState({});
  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("done");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const prefill = async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("region")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.region) setForm((f) => ({ ...f, location: data.region }));
    };
    prefill();
  }, [userId]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const updateFile = (key) => (file) => setFiles({ ...files, [key]: file });

  const canProceed = () => {
    if (step === 1) return form.farmSize && form.location && form.cropType && locationStatus === "done";
    if (step === 2) return form.amount && form.purpose;
    if (step === 3) return files.landDocument && files.farmSketch;
    if (step === 4) return files.farmPlan;
    if (step === 5) return files.passbook;
    if (step === 6) return form.guarantor1Name && form.guarantor1Contact && files.collateralOwnership && files.guarantorConsent && files.guarantorId;
    return true;
  };

  const monthlyEstimate = () => {
    const amount = Number(form.amount) || 0;
    const total = amount * (1 + ESTIMATED_RATE / 100);
    return Math.round(total / form.duration);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const { data: inserted, error: insertError } = await supabase
        .from("loan_applications")
        .insert({
          user_id: userId,
          mfi_id: mfiId,
          amount_requested: Number(form.amount),
          purpose: form.purpose,
          farm_size: form.farmSize,
          location: form.location,
          crop_type: form.cropType,
          estimated_yield: form.estimatedYield || null,
          preferred_duration_months: form.duration,
          latitude: coords ? coords.lat : null,
          longitude: coords ? coords.lng : null,
          cooperative: form.cooperative || null,
          guarantor1_name: form.guarantor1Name || null,
          guarantor1_contact: form.guarantor1Contact || null,
          guarantor2_name: form.guarantor2Name || null,
          guarantor2_contact: form.guarantor2Contact || null,
          equipment_pledge: form.equipmentPledge || null,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      const urls = {};
      for (const key of Object.keys(DOC_FIELDS)) {
        const file = files[key];
        if (!file) continue;
        const ext = file.name.split(".").pop();
        const path = `${userId}/loans/${inserted.id}/${key}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file);
        if (uploadError) throw new Error(`${key}: ${uploadError.message}`);
        urls[key] = path;
      }

      await supabase
        .from("loan_applications")
        .update({
          land_document_url: urls.landDocument || null,
          farm_sketch_url: urls.farmSketch || null,
          farm_plan_url: urls.farmPlan || null,
          farm_record_url: urls.farmRecord || null,
          coop_letter_url: urls.coopLetter || null,
          passbook_url: urls.passbook || null,
          collateral_ownership_url: urls.collateralOwnership || null,
          guarantor_consent_url: urls.guarantorConsent || null,
          guarantor_id_url: urls.guarantorId || null,
        })
        .eq("id", inserted.id);

      await sendEmail(
        userEmail,
        userName,
        "Your AgriLink loan application was received",
        `We've received your loan application for ${Number(form.amount).toLocaleString()} XAF to ${mfiName}. They'll review your documents and get back to you soon.`
      );

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: t("step_farm_info") },
    { n: 2, label: t("step_loan_details") },
    { n: 3, label: t("step_land_docs") },
    { n: 4, label: t("step_business_docs") },
    { n: 5, label: t("step_financial_id") },
    { n: 6, label: t("step_guarantors") },
    { n: 7, label: t("step_summary") },
  ];

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-forest">{t("loan_wizard_title")}</h2>
            <p className="text-xs text-sage">{t("applying_to")} {mfiName}</p>
          </div>
          <button onClick={onClose} className="text-sage hover:text-forest text-xl leading-none px-2">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pt-5 pb-2 overflow-x-auto">
          <div className="flex items-center min-w-[600px]">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                    step > s.n ? "bg-forest text-paper" :
                    step === s.n ? "bg-mint/25 text-forest border-2 border-forest" :
                    "bg-forest/5 text-sage"
                  }`}>
                    {step > s.n ? <Check size={14} /> : s.n}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${step >= s.n ? "text-forest" : "text-sage"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1.5 mb-4 transition ${step > s.n ? "bg-forest" : "bg-forest/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <StepField icon={<MapPin size={16} />} label={t("field_farm_size")} value={form.farmSize} onChange={update("farmSize")} placeholder="e.g. 2.4" />
              <StepField icon={<MapPin size={16} />} label={t("field_location")} value={form.location} onChange={update("location")} placeholder="e.g. West Region, CM" />
              <StepField icon={<Wheat size={16} />} label={t("field_crop_type")} value={form.cropType} onChange={update("cropType")} placeholder="e.g. Cocoa" />
              <StepField icon={<Wheat size={16} />} label={t("field_estimated_yield")} value={form.estimatedYield} onChange={update("estimatedYield")} placeholder="e.g. 800kg" />
              <StepField icon={<MapPin size={16} />} label={t("field_cooperative")} value={form.cooperative} onChange={update("cooperative")} />

              <div className="border border-forest/15 rounded-lg p-4">
                <p className="text-sm font-medium text-ink/80 mb-1">
                  {t("pin_location_title")} <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-sage mb-3">{t("pin_location_required")}</p>
                {locationStatus === "idle" && (
                  <button type="button" onClick={captureLocation} className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark">
                    {t("capture_location")}
                  </button>
                )}
                {locationStatus === "loading" && <p className="text-xs text-sage">{t("getting_location")}</p>}
                {locationStatus === "done" && coords && (
                  <p className="text-xs text-forest">{t("location_captured")} ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</p>
                )}
                {locationStatus === "denied" && (
                  <div>
                    <p className="text-xs text-red-600 mb-2">{t("location_denied")}</p>
                    <button type="button" onClick={captureLocation} className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark">
                      {t("try_again")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <StepField icon={<Wallet size={16} />} label={t("field_amount_requested")} type="number" value={form.amount} onChange={update("amount")} placeholder="e.g. 450000" />
              <div>
                <p className="text-sm font-medium text-ink/80 mb-2">{t("loan_purpose_label")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {PURPOSES.map((p) => (
                    <button key={p.key} type="button" onClick={() => setForm({ ...form, purpose: p.key })}
                      className={`text-sm font-medium py-2.5 rounded-lg border transition ${form.purpose === p.key ? "bg-forest text-paper border-forest" : "border-forest/20 text-forest/70 hover:bg-forest/5"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-ink/80 mb-2 flex items-center gap-1.5">
                  <Calendar size={15} /> {t("repayment_duration")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((d) => (
                    <button key={d} type="button" onClick={() => setForm({ ...form, duration: d })}
                      className={`text-sm font-medium py-2.5 rounded-lg border transition ${form.duration === d ? "bg-forest text-paper border-forest" : "border-forest/20 text-forest/70 hover:bg-forest/5"}`}>
                      {d} {t("months")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-sage mb-1">{t("land_docs_kicker")}</p>
              <Dropzone field={DOC_FIELDS.landDocument} icon={<FileText size={22} />} file={files.landDocument} onChange={updateFile("landDocument")} t={t} />
              <Dropzone field={DOC_FIELDS.farmSketch} icon={<FileImage size={22} />} file={files.farmSketch} onChange={updateFile("farmSketch")} t={t} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-sage mb-1">{t("business_docs_kicker")}</p>
              <Dropzone field={DOC_FIELDS.farmPlan} icon={<FileText size={22} />} file={files.farmPlan} onChange={updateFile("farmPlan")} t={t} />
              <Dropzone field={DOC_FIELDS.farmRecord} icon={<FileText size={22} />} file={files.farmRecord} onChange={updateFile("farmRecord")} t={t} />
              <Dropzone field={DOC_FIELDS.coopLetter} icon={<FileText size={22} />} file={files.coopLetter} onChange={updateFile("coopLetter")} t={t} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-xs text-sage mb-1">{t("financial_id_kicker")}</p>
              <Dropzone field={DOC_FIELDS.passbook} icon={<FileText size={22} />} file={files.passbook} onChange={updateFile("passbook")} t={t} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <p className="text-xs text-sage mb-1">{t("guarantors_kicker")}</p>
              <StepField label={t("guarantor_name")} value={form.guarantor1Name} onChange={update("guarantor1Name")} />
              <StepField label={t("guarantor_contact")} value={form.guarantor1Contact} onChange={update("guarantor1Contact")} />
              <StepField label={t("guarantor2_name")} value={form.guarantor2Name} onChange={update("guarantor2Name")} />
              <StepField label={t("guarantor2_contact")} value={form.guarantor2Contact} onChange={update("guarantor2Contact")} />
              <label className="block">
                <span className="text-sm font-medium text-ink/80 mb-1.5 block">{t("collateral_list_label")}</span>
                <textarea
                  value={form.equipmentPledge}
                  onChange={update("equipmentPledge")}
                  rows={2}
                  placeholder="e.g. 1 tiller, 4 goats"
                  className="w-full border border-forest/20 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest"
                />
              </label>
              <Dropzone field={DOC_FIELDS.collateralOwnership} icon={<FileText size={22} />} file={files.collateralOwnership} onChange={updateFile("collateralOwnership")} t={t} />
              <Dropzone field={DOC_FIELDS.guarantorConsent} icon={<FileText size={22} />} file={files.guarantorConsent} onChange={updateFile("guarantorConsent")} t={t} />
              <Dropzone field={DOC_FIELDS.guarantorId} icon={<FileText size={22} />} file={files.guarantorId} onChange={updateFile("guarantorId")} t={t} />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div className="bg-forest/5 rounded-xl p-4 space-y-2 text-sm">
                <SummaryRow label={t("summary_farm")} value={`${form.farmSize} ha, ${form.cropType}, ${form.location}`} />
                <SummaryRow label={t("summary_amount")} value={`${Number(form.amount || 0).toLocaleString()} XAF`} />
                <SummaryRow label={t("summary_purpose")} value={form.purpose || t("not_set")} />
                <SummaryRow label={t("summary_duration")} value={`${form.duration} ${t("months")}`} />
                <SummaryRow label={t("summary_guarantor")} value={form.guarantor1Name || t("not_set")} />
                <SummaryRow label={t("summary_docs")} value={`${Object.keys(files).length} ${t("of")} ${Object.keys(DOC_FIELDS).length}`} />
              </div>
              <div className="bg-mint/10 border border-mint/30 rounded-xl p-4">
                <p className="text-xs text-sage mb-1">{t("estimated_repayment")}</p>
                <p className="font-display text-2xl font-semibold text-forest">
                  {monthlyEstimate().toLocaleString()} XAF<span className="text-sm font-normal text-sage">{t("per_month")}</span>
                </p>
                <p className="text-[11px] text-sage mt-1">{t("placeholder_rate_note", { rate: ESTIMATED_RATE })}</p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-forest/10 px-6 py-4 flex justify-between">
          <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
            className="flex items-center gap-1 text-sm font-medium px-4 py-2.5 rounded-lg border border-forest/20 text-forest/70 hover:bg-forest/5 disabled:opacity-40">
            <ChevronLeft size={16} /> {t("back")}
          </button>
          {step < 7 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
              className="flex items-center gap-1 text-sm font-medium px-5 py-2.5 rounded-lg bg-forest text-paper hover:bg-forestdark transition disabled:opacity-40">
              {t("next")} <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-1 text-sm font-medium px-5 py-2.5 rounded-lg bg-forest text-paper hover:bg-forestdark transition disabled:opacity-60">
              {loading ? t("submitting_loan") : t("submit_to_mfi")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepField({ icon, label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80 mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-forest/20 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest" />
    </label>
  );
}

function Dropzone({ field, icon, file, onChange, t }) {
  const [dragging, setDragging] = useState(false);
  return (
    <label
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
          <span className="text-sage">{icon}</span>
          <span className="text-sm text-ink/70 font-medium text-center px-4">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </span>
          <span className="text-xs text-sage flex items-center gap-1"><Upload size={12} /> {t("drop_or_browse")}</span>
        </>
      )}
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-sage">{label}</span>
      <span className="text-ink font-medium text-right">{value}</span>
    </div>
  );
}