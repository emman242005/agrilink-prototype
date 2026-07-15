import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const DOC_FIELDS = [
  { key: "land_document_url", label: "Land document" },
  { key: "farm_sketch_url", label: "Farm sketch" },
  { key: "farm_plan_url", label: "Farm plan" },
  { key: "farm_record_url", label: "Farm record" },
  { key: "coop_letter_url", label: "Coop letter" },
  { key: "id_card_url", label: "ID card" },
  { key: "passbook_url", label: "Passbook" },
];

export default function KycReviewModal({ submission, onClose, onApprove, onDeny }) {
  const [docUrls, setDocUrls] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const loadDocs = async () => {
      const urls = {};
      for (const doc of DOC_FIELDS) {
        const path = submission[doc.key];
        if (path) {
          const { data } = await supabase.storage
            .from("kyc-documents")
            .createSignedUrl(path, 300);
          if (data?.signedUrl) urls[doc.key] = data.signedUrl;
        }
      }
      setDocUrls(urls);
      setLoadingDocs(false);
    };
    loadDocs();
  }, [submission]);

  const isPdf = (url) => url?.split("?")[0].toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-gold tracking-widest mb-1">KYC REVIEW</p>
            <h2 className="font-display text-xl font-semibold text-forest">{submission.full_name}</h2>
          </div>
          <button onClick={onClose} className="text-sage hover:text-forest text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
            <InfoRow label="Email" value={submission.profiles?.email} />
            <InfoRow label="Phone" value={submission.phone} />
            <InfoRow label="National ID" value={submission.national_id} />
            <InfoRow label="Region" value={submission.region} />
            <InfoRow label="Crop" value={submission.crop} />
            <InfoRow label="Farm size" value={submission.farm_size} />
            <InfoRow label="Cooperative" value={submission.cooperative || "—"} />
            <InfoRow label="Equipment pledge" value={submission.equipment_pledge || "—"} />
            <InfoRow
              label="Guarantor 1"
              value={submission.guarantor1_name ? `${submission.guarantor1_name} (${submission.guarantor1_contact})` : "—"}
            />
            <InfoRow
              label="Guarantor 2"
              value={submission.guarantor2_name ? `${submission.guarantor2_name} (${submission.guarantor2_contact})` : "—"}
            />
          </div>

          <h3 className="font-display text-sm font-semibold text-forest mb-3">Documents</h3>
          {loadingDocs && <p className="text-sm text-sage">Loading documents…</p>}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {DOC_FIELDS.map((doc) => {
              const url = docUrls[doc.key];
              if (!url) return null;
              return (
                <button
                  key={doc.key}
                  onClick={() => setLightbox({ url, label: doc.label })}
                  className="border border-forest/15 rounded-lg overflow-hidden hover:border-forest/40 transition text-left"
                >
                  <div className="h-24 bg-forest/5 flex items-center justify-center">
                    {isPdf(url) ? (
                      <span className="text-2xl">📄</span>
                    ) : (
                      <img src={url} alt={doc.label} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-ink/80 px-2 py-1.5">{doc.label}</p>
                </button>
              );
            })}
          </div>

          {submission.status === "pending" && (
            <div className="flex gap-3 pt-4 border-t border-forest/10">
              <button
                onClick={() => { onApprove(submission); onClose(); }}
                className="flex-1 bg-forest text-paper font-medium py-2.5 rounded-lg hover:bg-forestdark transition"
              >
                Approve
              </button>
              <button
                onClick={() => { onDeny(submission); onClose(); }}
                className="flex-1 border border-forest/20 text-forest/70 font-medium py-2.5 rounded-lg hover:bg-forest/5 transition"
              >
                Deny
              </button>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-ink/80 flex items-center justify-center p-8 z-[60]"
          onClick={() => setLightbox(null)}
        >
          <div className="bg-white rounded-xl max-w-3xl max-h-[85vh] w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-forest/10">
              <p className="text-sm font-medium text-forest">{lightbox.label}</p>
              <button onClick={() => setLightbox(null)} className="text-sage hover:text-forest text-lg leading-none px-2">
                ×
              </button>
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

function InfoRow({ label, value }) {
  return (
    <p className="text-ink/70">
      <span className="text-sage">{label}:</span> {value}
    </p>
  );
}