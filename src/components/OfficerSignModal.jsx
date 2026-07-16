import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function OfficerSignModal({ loan, officerName, onClose, onSigned }) {
  const [signatureName, setSignatureName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSign = async () => {
    setError("");
    if (!signatureName.trim()) {
      setError("Type your name to countersign.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase
      .from("loan_applications")
      .update({
        officer_signature: signatureName.trim(),
        officer_signed_at: new Date().toISOString(),
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
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest">Countersign Agreement</h2>
          <button onClick={onClose} className="text-sage hover:text-forest px-2">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <pre className="whitespace-pre-wrap text-sm text-ink/80 bg-forest/5 rounded-xl p-4 mb-5 font-body leading-relaxed max-h-64 overflow-y-auto">
            {loan.agreement_text}
          </pre>

          <div className="bg-forest/5 rounded-lg px-4 py-3 mb-4 text-sm">
            <p className="text-sage">Farmer signature:</p>
            <p className="font-display italic text-forest">{loan.farmer_signature}</p>
            <p className="text-xs text-sage mt-1">
              Signed {new Date(loan.farmer_signed_at).toLocaleString()}
            </p>
          </div>

          <label className="block mb-4">
            <span className="text-sm font-medium text-ink/80 mb-1.5 block">
              Type your name to countersign as loan officer
            </span>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder={officerName}
              className="w-full border border-forest/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest font-display italic"
            />
          </label>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            onClick={handleSign}
            disabled={saving}
            className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
          >
            {saving ? "Signing..." : "Countersign"}
          </button>
        </div>
      </div>
    </div>
  );
}