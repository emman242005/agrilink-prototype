import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { computeRiskScore, RISK_BAND_STYLES } from "../lib/riskScore";

const DOC_DISPLAY = [
  { key: "land_document_url", label: "Land document" },
  { key: "farm_sketch_url", label: "Farm sketch" },
  { key: "farm_plan_url", label: "Farm plan" },
  { key: "farm_record_url", label: "Farm record" },
  { key: "coop_letter_url", label: "Coop letter" },
  { key: "passbook_url", label: "Passbook" },
  { key: "collateral_ownership_url", label: "Collateral ownership" },
  { key: "guarantor_consent_url", label: "Guarantor consent" },
  { key: "guarantor_id_url", label: "Guarantor ID" },
];

export default function AdminLoanDetailModal({ loan, onClose }) {
  const [docUrls, setDocUrls] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [identity, setIdentity] = useState(null);

  useEffect(() => {
    const load = async () => {
      const urls = {};
      for (const doc of DOC_DISPLAY) {
        const path = loan[doc.key];
        if (path) {
          const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 300);
          if (data?.signedUrl) urls[doc.key] = { url: data.signedUrl, label: doc.label };
        }
      }
      setDocUrls(urls);
      setLoadingDocs(false);

      const { data: kyc } = await supabase
        .from("kyc_submissions")
        .select("full_name, phone, age, year_of_birth, region")
        .eq("user_id", loan.user_id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();
      setIdentity(kyc);
    };
    load();
  }, [loan]);

  const isPdf = (url) => url?.split("?")[0].toLowerCase().endsWith(".pdf");
  const { score, maxScore, band, breakdown } = computeRiskScore(loan);
  const style = RISK_BAND_STYLES[band];

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-gold tracking-widest mb-1">LOAN DETAIL — VIEW ONLY</p>
            <h2 className="font-display text-xl font-semibold text-forest">
              {loan.profiles?.full_name || loan.profiles?.email}
            </h2>
            <p className="text-xs text-sage mt-0.5">Applied to {loan.mfis?.name || "—"}</p>
          </div>
          <button onClick={onClose} className="text-sage hover:text-forest text-xl leading-none px-2">×</button>
        </div>

        <div className="px-6 py-5">
          <div className="bg-gold/10 border border-gold/30 rounded-lg px-3 py-2 mb-5">
            <p className="text-xs text-gold">
              This decision belongs to {loan.mfis?.name || "the receiving MFI"}. You're viewing this for network oversight only.
            </p>
          </div>

          {identity && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-ink/70 mb-5 bg-forest/5 rounded-lg p-3">
              <p>Age: {identity.age || "—"}</p>
              <p>Year of birth: {identity.year_of_birth || "—"}</p>
              <p>Phone: {identity.phone || "—"}</p>
              <p>Region: {identity.region || "—"}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
            <InfoRow label="Amount requested" value={`${Number(loan.amount_requested).toLocaleString()} XAF`} />
            <InfoRow label="Purpose" value={loan.purpose} />
            <InfoRow label="Farm size" value={loan.farm_size || "—"} />
            <InfoRow label="Location" value={loan.location || "—"} />
            <InfoRow label="Crop type" value={loan.crop_type || "—"} />
            <InfoRow label="Preferred duration" value={loan.preferred_duration_months ? `${loan.preferred_duration_months} months` : "—"} />
            <InfoRow
              label="GPS location"
              value={loan.latitude ? <a href={"https://www.google.com/maps?q=" + loan.latitude + "," + loan.longitude} target="_blank" rel="noreferrer" className="text-forest underline">View on map</a> : "Not captured"}
            />
            <InfoRow label="Guarantor" value={loan.guarantor1_name ? `${loan.guarantor1_name} (${loan.guarantor1_contact})` : "—"} />
            <InfoRow label="Collateral pledged" value={loan.equipment_pledge || "—"} />
            <InfoRow label="Status" value={loan.status?.toUpperCase()} />
          </div>

          <div className="bg-forest/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold text-forest">Risk score</h3>
              <span className={`font-mono text-xs px-2.5 py-1 rounded-full ${style.className}`}>{score}/{maxScore} {style.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {breakdown.map((item) => (
                <p key={item.label} className={`text-xs ${item.earned > 0 ? "text-ink/70" : "text-sage/60 line-through"}`}>
                  {item.label} ({item.earned}/{item.max})
                </p>
              ))}
            </div>
          </div>

          <h3 className="font-display text-sm font-semibold text-forest mb-3">Documents</h3>
          {loadingDocs && <p className="text-sm text-sage mb-4">Loading documents...</p>}
          {!loadingDocs && Object.keys(docUrls).length === 0 && (
            <p className="text-sm text-sage mb-4">No documents on file.</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(docUrls).map(([key, doc]) => (
              <DocThumb key={key} url={doc.url} label={doc.label} isPdf={isPdf(doc.url)} onClick={() => setLightbox(doc)} />
            ))}
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-ink/80 flex items-center justify-center p-8 z-[60]" onClick={() => setLightbox(null)}>
          <div className="bg-white rounded-xl max-w-3xl max-h-[85vh] w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-forest/10">
              <p className="text-sm font-medium text-forest">{lightbox.label}</p>
              <button onClick={() => setLightbox(null)} className="text-sage hover:text-forest text-lg leading-none px-2">×</button>
            </div>
            {isPdf(lightbox.url) ? <iframe src={lightbox.url} title={lightbox.label} className="w-full h-[70vh]" /> : <img src={lightbox.url} alt={lightbox.label} className="w-full max-h-[70vh] object-contain" />}
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
  return <p className="text-ink/70"><span className="text-sage">{label}:</span> {value}</p>;
}