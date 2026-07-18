import { useAuth } from "../context/AuthContext";

export default function MfiPending() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-forestdark flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <p className="font-mono text-xs text-gold tracking-widest mb-3">APPLICATION SUBMITTED</p>
        <h1 className="font-display text-2xl font-semibold text-paper mb-3">
          Your MFI registration is under review
        </h1>
        <p className="text-sm text-paper/70 mb-8">
          AgriLink reviews every institution before granting dashboard access. You'll receive an email once a decision is made.
        </p>
        <button
          onClick={signOut}
          className="text-sm font-medium px-6 py-2.5 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}