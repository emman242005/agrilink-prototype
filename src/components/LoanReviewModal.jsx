import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const KYC_DOC_FIELDS = [
  { key: "land_document_url", label: "Land document (KYC)" },
  { key: "farm_sketch_url", label: "Farm sketch (KYC)" },
  { key: "farm_plan_url", label: "Farm plan (KYC)" },
  { key: "farm_record_url", label: "Farm record (KYC)" },
  { key: "coop_letter_url", label: "Coop letter (KYC)" },
  { key: "id_card_url", label: "ID card (KYC)" },
  { key: "passbook_url", label: "Passbook (KYC)" },
];

export default function LoanReviewModal({ loan, onClose, onApprove, onDecline }) {
  const [docUrls, setDocUrls] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [rate, setRate] = useState("12");
  const [term, setTerm] = useState(String(loan.preferred_duration_months || 6));

  useEffect(() => {
    const loadDocs = async () => {
      const urls = {};

      // Loan-specific documents
      for (const [key, path, label] of [
        ["landProof", loan.land_proof_url, "Land proof (loan)"],
        ["farmPhoto", loan.farm_photo_url, "Farm photo (loan)"],
      ]) {
        if (path) {
          const { data } = await supabase.storage
            .from("kyc-documents")
            .createSignedUrl(path, 300);
          if (data?.signedUrl) urls[key] = { url: data.signedUrl, label };
        }
      }

      // Pull the farmer's KYC documents too, for a full review
      const { data: kyc } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", loan.user_id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();

      if (kyc) {
        for (const doc of KYC_DOC_FIELDS) {
          const path = kyc[doc.key];
          if (path) {
            const { data } = await supabase.storage
              .from("kyc-documents")
              .createSignedUrl(path, 300);
            if (data?.signedUrl) urls[doc.key] = { url: data.signedUrl, label: doc.label };
          }
        }
      }

      setDocUrls(urls);
      setLoadingDocs(false);
    };
    loadDocs();
  }, [loan]);

  const isPdf = (url) => url?.split("?")[0].toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-gold tracking-widest mb-1">LOAN REVIEW</p>
            <h2 className="font-display text-xl font-semibold text-forest">
              {loan.profiles?.full_name || loan.profiles?.email}
            </h2>
          </div>
          <button onClick={onClose} className="text-sage hover:text-forest text-xl leading-none px-2">×</button>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
            <InfoRow label="Amount requested" value={`${Number(loan.amount_requested).toLocaleString()} XAF`} />
            <InfoRow label="Purpose" value={loan.purpose} />
            <InfoRow label="Farm size" value={loan.farm_size || "—"} />
            <InfoRow label="Location" value={loan.location || "—"} />
            <InfoRow label="Crop type" value={loan.crop_type || "—"} />
            <InfoRow label="Estimated yield" value={loan.estimated_yield || "—"} />
            <InfoRow label="Preferred duration" value={loan.preferred_duration_months ? `${loan.preferred_duration_months} months` : "—"} />
            <InfoRow label="Submitted" value={new Date(loan.submitted_at).toLocaleDateString()} />
            <InfoRow
              label="Mobile money"
              value={
                loan.profiles?.mobile_money_number
                  ? `${loan.profiles.mobile_money_provider} ${loan.profiles.mobile_money_number}`
                  : "Not set"
              }
            />
          </div>

          <h3 className="font-display text-sm font-semibold text-forest mb-3">Documents</h3>
          {loadingDocs && <p className="text-sm text-sage mb-4">Loading documents…</p>}
          {!loadingDocs && Object.keys(docUrls).length === 0 && (
            <p className="text-sm text-sage mb-4">No documents on file for this application.</p>
          )}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Object.entries(docUrls).map(([key, doc]) => (
              <DocThumb
                key={key}
                url={doc.url}
                label={doc.label}
                isPdf={isPdf(doc.url)}
                onClick={() => setLightbox(doc)}
              />
            ))}
          </div>

          {loan.status === "pending" ? (
            <div className="pt-4 border-t border-forest/10">
              <div className="flex items-end gap-4 mb-4">
                <label className="block">
                  <span className="text-xs font-medium text-ink/70 mb-1 block">Interest rate (%)</span>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-24 border border-forest/20 rounded-lg px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink/70 mb-1 block">Term (months)</span>
                  <input
                    type="number"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-24 border border-forest/20 rounded-lg px-3 py-1.5 text-sm"
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { onApprove(loan, Number(rate), Number(term)); onClose(); }}
                  className="flex-1 bg-forest text-paper font-medium py-2.5 rounded-lg hover:bg-forestdark transition"
                >
                  Approve & generate schedule
                </button>
                <button
                  onClick={() => { onDecline(loan); onClose(); }}
                  className="flex-1 border border-forest/20 text-forest/70 font-medium py-2.5 rounded-lg hover:bg-forest/5 transition"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-forest/10">
              <p className="text-sm text-sage">
                Status: <span className="font-medium text-ink">{loan.status.toUpperCase()}</span>
                {(loan.status === "approved" || loan.status === "disbursed") && ` · ${loan.interest_rate}% · ${loan.term_months} months`}
              </p>
              {loan.status === "approved" && (
                <p className="text-xs text-gold mt-1">Awaiting disbursement — use "Mark disbursed" from the loans table.</p>
              )}
              {loan.status === "disbursed" && (
                <p className="text-xs text-forest mt-1">
                  Disbursed {new Date(loan.disbursed_at).toLocaleDateString()} · ref: {loan.disbursement_reference}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-ink/80 flex items-center justify-center p-8 z-[60]" onClick={() => setLightbox(null)}>
          <div className="bg-white rounded-xl max-w-3xl max-h-[85vh] w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-forest/10">
              <p className="text-sm font-medium text-forest">{lightbox.label}</p>
              <button onClick={() => setLightbox(null)} className="text-sage hover:text-forest text-lg leading-none px-2">×</button>
            </div>
            {isPdf(lightbox.url) ? (
              <iframe src={lightbox.url} title={lightbox.label} className="w-full h-[70vh]" />
            ) : (
              <img src={lightbox.url} alt={lightbox.label} className="w-full max-h-[70vh] object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DocThumb({ url, label, isPdf, onClick }) {
  return (
    <button onClick={onClick} className="border border-forest/15 rounded-lg overflow-hidden hover:border-forest/40 transition text-left">
      <div className="h-24 bg-forest/5 flex items-center justify-center">
        {isPdf ? <span className="text-2xl">📄</span> : <img src={url} alt={label} className="w-full h-full object-cover" />}
      </div>
      <p className="text-xs font-medium text-ink/80 px-2 py-1.5">{label}</p>
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <p className="text-ink/70">
      <span className="text-sage">{label}:</span> {value}
    </p>
  );
}