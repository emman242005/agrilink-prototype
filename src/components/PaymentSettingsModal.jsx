import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { sendEmail } from "../lib/sendEmail";
import orangeLogo from "../assets/images/logo.png";
import mtnLogo from "../assets/images/logo2.png";

const PROVIDERS = [
  { key: "Orange", logo: orangeLogo },
  { key: "MTN", logo: mtnLogo },
];

export default function PaymentSettingsModal({ userId, userEmail, userName, currentProvider, currentNumber, currentHolderName, onClose, onSaved }) {
  const { t } = useTranslation();
  const [provider, setProvider] = useState(currentProvider || "MTN");
  const [number, setNumber] = useState(currentNumber || "");
  const [holderName, setHolderName] = useState(currentHolderName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!number.trim()) {
      setError(t("payment_error_number"));
      return;
    }
    if (!holderName.trim()) {
      setError(t("payment_error_name"));
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        mobile_money_provider: provider,
        mobile_money_number: number.trim(),
        mobile_money_holder_name: holderName.trim(),
      })
      .eq("id", userId);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    await sendEmail(
      userEmail,
      userName,
      "Your AgriLink payment details were updated",
      `Your mobile money details were changed to ${provider} ${number.trim()} (${holderName.trim()}). If you did not make this change, please contact your MFI immediately.`
    );

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest">{t("payment_title")}</h2>
          <button onClick={onClose} className="text-sage hover:text-forest px-2"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-sage">{t("payment_intro")}</p>
          <div>
            <p className="text-sm font-medium text-ink/80 mb-2">{t("payment_provider")}</p>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setProvider(p.key)}
                  className={`flex flex-col items-center gap-2 py-3 rounded-lg border transition ${
                    provider === p.key ? "bg-forest/5 border-forest" : "border-forest/20 hover:bg-forest/5"
                  }`}
                >
                  <img src={p.logo} alt={p.key} className="h-8 object-contain" />
                  <span className={`text-xs font-medium ${provider === p.key ? "text-forest" : "text-forest/60"}`}>
                    {p.key} Mobile Money
                  </span>
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-ink/80 mb-1.5 block">{t("payment_holder_name")}</span>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="e.g. Alobwede Emmanuel"
              className="w-full border border-forest/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/80 mb-1.5 block">{t("payment_number")}</span>
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. 678908453"
              className="w-full border border-forest/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-forest text-paper font-medium py-2.5 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
          >
            {saving ? t("payment_saving") : t("payment_save_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}