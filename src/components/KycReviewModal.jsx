import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function KycReviewModal({ submission, onClose, onApprove, onDeny }) {
  const [idUrl, setIdUrl] = useState(null);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!submission.id_card_url) return;
      const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(submission.id_card_url, 300);
      if (data?.signedUrl) setIdUrl(data.signedUrl);
    };
    load();
  }, [submission]);

  const isPdf = submission.id_card_url?.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-gold tracking-widest mb-1">IDENTITY REVIEW</p>
            <h2 className="font-display text-xl font-semibold text-forest">{submission.full_name}</h2>
          </div>
          <button onClick={onClose} className="text-sage hover:text-forest text-xl leading-none px-2">×</button>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6">
            <InfoRow label="Email" value={submission.profiles?.email} />
            <InfoRow label="Phone" value={submission.phone} />
            <InfoRow label="Age" value={submission.age} />
            <InfoRow label="Year of birth" value={submission.year_of_birth} />
            <InfoRow label="Region" value={submission.region} />
          </div>

          <p className="text-xs font-medium text-ink/70 mb-2">National ID</p>
          {idUrl ? (
            <button onClick={() => setLightbox(true)} className="block w-full border border-forest/15 rounded-lg overflow-hidden hover:border-forest/40 transition mb-6">
              {isPdf ? (
                <div className="h-40 bg-forest/5 flex items-center justify-center text-3xl">📄</div>
              ) : (
                <img src={idUrl} alt="National ID" className="w-full h-40 object-cover" />
              )}
            </button>
          ) : (
            <p className="text-sm text-sage mb-6">No ID document on file.</p>
          )}

          <p className="text-xs text-sage bg-forest/5 rounded-lg p-3 mb-6">
            This is an identity check only. Farm, financial, and guarantor documents are reviewed separately when this farmer applies for a loan.
          </p>

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

      {lightbox && idUrl && (
        <div className="fixed inset-0 bg-ink/80 flex items-center justify-center p-8 z-[60]" onClick={() => setLightbox(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-forest/10">
              <p className="text-sm font-medium text-forest">National ID</p>
              <button onClick={() => setLightbox(false)} className="text-sage hover:text-forest text-lg leading-none px-2">×</button>
            </div>
            {isPdf ? <iframe src={idUrl} title="National ID" className="w-full h-[70vh]" /> : <img src={idUrl} alt="National ID" className="w-full max-h-[70vh] object-contain" />}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return <p className="text-ink/70"><span className="text-sage">{label}:</span> {value || "—"}</p>;
}