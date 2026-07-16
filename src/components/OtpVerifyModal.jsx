import { useState } from "react";
import { X } from "lucide-react";
import { createAndSendOtp, verifyOtp } from "../lib/otp";

export default function OtpVerifyModal({ userId, email, name, onVerified, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await verifyOtp(userId, code);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    onVerified();
  };

  const handleResend = async () => {
    setResending(true);
    await createAndSendOtp(userId, email, name);
    setResending(false);
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest">Verify it's you</h2>
          <button onClick={onCancel} className="text-sage hover:text-forest px-2">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleVerify} className="px-6 py-5">
          <p className="text-sm text-sage mb-4">
            We sent a 6-digit code to {email}. Enter it below to finish logging in.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full border border-forest/20 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest mb-4"
            autoFocus
          />
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-forest text-paper font-medium py-3 rounded-lg hover:bg-forestdark transition disabled:opacity-60 mb-3"
          >
            {loading ? "Verifying..." : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full text-sm text-forest underline"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </form>
      </div>
    </div>
  );
}