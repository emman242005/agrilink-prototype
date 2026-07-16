import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { generateAgreementText } from "../lib/generateAgreement";

export default function SignAgreementModal({ loan, farmerName, onClose, onSigned }) {
  const [agreed, setAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const agreementText = generateAgreementText(loan, farmerName);

  const handleSign = async () => {
    setError("");
    if (!agreed) {
      setError("You must check the box to agree to the terms.");
      return;
    }
    if (signatureName.trim().toLowerCase() !== farmerName.trim().toLowerCase()) {
      setError("Please type your full name exactly as it appears on your account to sign.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase
      .from("loan_applications")
      .update({
        agreement_text: agreementText,
        farmer_signature: signatureName.trim(),
        farmer_signed_at: new Date().toISOString(),
      })
      .eq("id", loan.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onSigned();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest">Loan Agreement</h2>
          <button onClick={onClose} className="text-sage hover:text-forest px-2">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <pre className="whitespace-pre-wrap text-sm text-ink/80 bg-forest/5 rounded-xl p-4 mb-5 font-body leading-relaxed">
            {agreementText}
          </pre>

          <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-ink/80">
              I have read and agree to the terms and conditions of this loan agreement.
            </span>
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-ink/80 mb-1.5 block">
              Type your full name to sign
            </span>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder={farmerName}
              className="w-full border border-forest/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest font-display italic"
            />
          </label>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            onClick={handleSign}
            disabled={saving}
            className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
          >
            {saving ? "Signing..." : "Sign and Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}