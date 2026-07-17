export default function KycReviewModal({ submission, onClose, onApprove, onDeny }) {
  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-gold tracking-widest mb-1">IDENTITY REVIEW</p>
            <h2 className="font-display text-xl font-semibold text-forest">{submission.full_name}</h2>
          </div>
          <button onClick={onClose} className="text-sage hover:text-forest text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6">
            <InfoRow label="Email" value={submission.profiles?.email} />
            <InfoRow label="Phone" value={submission.phone} />
            <InfoRow label="Age" value={submission.age} />
            <InfoRow label="Year of birth" value={submission.year_of_birth} />
            <InfoRow label="Region" value={submission.region} />
          </div>

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
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <p className="text-ink/70">
      <span className="text-sage">{label}:</span> {value || "—"}
    </p>
  );
}