import { useEffect, useState } from "react";
import {
  MapPin, Wheat, Landmark, Wallet, Calendar, Upload, Check,
  ChevronRight, ChevronLeft, X, FileImage, FileText,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const PURPOSES = ["Seeds", "Irrigation", "Machinery", "Fertilizer", "Other"];
const DURATIONS = [6, 12, 18];
const ESTIMATED_RATE = 12; // placeholder, final rate set by the MFI at review

export default function LoanApplicationWizard({ userId, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    farmSize: "", location: "", cropType: "", estimatedYield: "",
    amount: "", purpose: "", duration: 12,
  });
  const [files, setFiles] = useState({ landProof: null, farmPhoto: null });

  useEffect(() => {
    const prefill = async () => {
      const { data } = await supabase
        .from("kyc_submissions")
        .select("farm_size, region, crop")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setForm((f) => ({
          ...f,
          farmSize: data.farm_size || "",
          location: data.region || "",
          cropType: data.crop || "",
        }));
      }
    };
    prefill();
  }, [userId]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const canProceed = () => {
    if (step === 1) return form.farmSize && form.location && form.cropType;
    if (step === 2) return form.amount && form.purpose;
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
          amount_requested: Number(form.amount),
          purpose: form.purpose,
          farm_size: form.farmSize,
          location: form.location,
          crop_type: form.cropType,
          estimated_yield: form.estimatedYield || null,
          preferred_duration_months: form.duration,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      const urls = {};
      for (const [key, file] of Object.entries(files)) {
        if (!file) continue;
        const ext = file.name.split(".").pop();
        const path = `${userId}/loans/${inserted.id}/${key}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("kyc-documents")
          .upload(path, file);
        if (uploadError) throw new Error(uploadError.message);
        urls[key] = path;
      }

      if (Object.keys(urls).length > 0) {
        await supabase
          .from("loan_applications")
          .update({
            land_proof_url: urls.landProof || null,
            farm_photo_url: urls.farmPhoto || null,
          })
          .eq("id", inserted.id);
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: "Farm info" },
    { n: 2, label: "Loan details" },
    { n: 3, label: "Documents" },
    { n: 4, label: "Summary" },
  ];

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest">Loan application</h2>
          <button onClick={onClose} className="text-sage hover:text-forest text-xl leading-none px-2">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center">
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
                  <span className={`text-[11px] font-medium ${step >= s.n ? "text-forest" : "text-sage"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 mb-4 transition ${step > s.n ? "bg-forest" : "bg-forest/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <StepField icon={<MapPin size={16} />} label="Farm size (hectares)" value={form.farmSize} onChange={update("farmSize")} placeholder="e.g. 2.4" />
              <StepField icon={<MapPin size={16} />} label="Location" value={form.location} onChange={update("location")} placeholder="e.g. West Region, CM" />
              <StepField icon={<Wheat size={16} />} label="Primary crop type" value={form.cropType} onChange={update("cropType")} placeholder="e.g. Cocoa" />
              <StepField icon={<Wheat size={16} />} label="Estimated annual yield (optional)" value={form.estimatedYield} onChange={update("estimatedYield")} placeholder="e.g. 800kg" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <StepField icon={<Wallet size={16} />} label="Requested amount (XAF)" type="number" value={form.amount} onChange={update("amount")} placeholder="e.g. 450000" />

              <div>
                <p className="text-sm font-medium text-ink/80 mb-2">Loan purpose</p>
                <div className="grid grid-cols-3 gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, purpose: p })}
                      className={`text-sm font-medium py-2.5 rounded-lg border transition ${
                        form.purpose === p
                          ? "bg-forest text-paper border-forest"
                          : "border-forest/20 text-forest/70 hover:bg-forest/5"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-ink/80 mb-2 flex items-center gap-1.5">
                  <Calendar size={15} /> Preferred repayment duration
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({ ...form, duration: d })}
                      className={`text-sm font-medium py-2.5 rounded-lg border transition ${
                        form.duration === d
                          ? "bg-forest text-paper border-forest"
                          : "border-forest/20 text-forest/70 hover:bg-forest/5"
                      }`}
                    >
                      {d} months
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Dropzone
                icon={<FileText size={22} />}
                label="Proof of land ownership"
                file={files.landProof}
                onChange={(f) => setFiles({ ...files, landProof: f })}
              />
              <Dropzone
                icon={<FileImage size={22} />}
                label="Farm photos"
                file={files.farmPhoto}
                onChange={(f) => setFiles({ ...files, farmPhoto: f })}
              />
              <p className="text-xs text-sage">Both are optional here but speed up MFI review.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-forest/5 rounded-xl p-4 space-y-2 text-sm">
                <SummaryRow label="Farm" value={`${form.farmSize} ha · ${form.cropType} · ${form.location}`} />
                <SummaryRow label="Amount requested" value={`${Number(form.amount || 0).toLocaleString()} XAF`} />
                <SummaryRow label="Purpose" value={form.purpose || "—"} />
                <SummaryRow label="Preferred duration" value={`${form.duration} months`} />
              </div>

              <div className="bg-mint/10 border border-mint/30 rounded-xl p-4">
                <p className="text-xs text-sage mb-1">Estimated monthly repayment</p>
                <p className="font-display text-2xl font-semibold text-forest">
                  {monthlyEstimate().toLocaleString()} XAF<span className="text-sm font-normal text-sage">/mo</span>
                </p>
                <p className="text-[11px] text-sage mt-1">
                  Based on a placeholder {ESTIMATED_RATE}% rate — your MFI sets the final rate and term at approval.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-forest/10 px-6 py-4 flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1 text-sm font-medium px-4 py-2.5 rounded-lg border border-forest/20 text-forest/70 hover:bg-forest/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1 text-sm font-medium px-5 py-2.5 rounded-lg bg-forest text-paper hover:bg-forestdark transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1 text-sm font-medium px-5 py-2.5 rounded-lg bg-forest text-paper hover:bg-forestdark transition disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit to MFI"}
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
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-forest/20 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest"
      />
    </label>
  );
}

function Dropzone({ icon, label, file, onChange }) {
  const [dragging, setDragging] = useState(false);

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onChange(f);
      }}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition ${
        dragging ? "border-forest bg-mint/10" : file ? "border-forest/40 bg-forest/5" : "border-forest/20 hover:bg-forest/5"
      }`}
    >
      <input
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
      />
      {file ? (
        <>
          <Check size={20} className="text-forest" />
          <span className="text-sm text-forest font-medium">{file.name}</span>
        </>
      ) : (
        <>
          <span className="text-sage">{icon}</span>
          <span className="text-sm text-ink/70 font-medium">{label}</span>
          <span className="text-xs text-sage flex items-center gap-1"><Upload size={12} /> Drop file or click to browse</span>
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