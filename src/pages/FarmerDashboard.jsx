import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Field } from "./SignUp";
import NotificationBell from "../components/NotificationBell";

export default function FarmerDashboard() {
  const { session, profile, signOut } = useAuth();
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", purpose: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadLoans = async () => {
    const { data } = await supabase
      .from("loan_applications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("submitted_at", { ascending: false });
    setLoans(data || []);
  };

  const loadRepayments = async (loanIds) => {
    if (loanIds.length === 0) return;
    const { data } = await supabase
      .from("loan_repayments")
      .select("*")
      .in("loan_id", loanIds)
      .order("installment_number", { ascending: true });

    const grouped = {};
    (data || []).forEach((r) => {
      if (!grouped[r.loan_id]) grouped[r.loan_id] = [];
      grouped[r.loan_id].push(r);
    });
    setRepayments(grouped);
  };

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    if (loans.length > 0) {
      loadRepayments(loans.filter((l) => l.status === "approved").map((l) => l.id));
    }
  }, [loans]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from("loan_applications").insert({
      user_id: session.user.id,
      amount_requested: Number(form.amount),
      purpose: form.purpose,
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ amount: "", purpose: "" });
    loadLoans();
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-forest/15">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display text-2xl font-semibold text-forest">AgriLink</span>
          <div className="flex items-center gap-2">
            <NotificationBell userId={session.user.id} />
            <button onClick={signOut} className="text-sm text-sage hover:text-forest ml-2">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <p className="font-mono text-xs text-gold tracking-widest mb-2">VERIFIED FARMER</p>
        <h1 className="font-display text-3xl font-semibold text-forest mb-8">
          Welcome, {profile?.full_name || "there"}
        </h1>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-forest text-paper font-medium px-5 py-3 rounded-lg hover:bg-forestdark transition mb-8"
          >
            Apply for a new loan
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-forest/10 rounded-xl p-6 space-y-5 mb-8 max-w-md">
            <Field
              label="Amount requested (XAF)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <Field
              label="Purpose"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="e.g. Seeds and fertilizer for planting season"
              required
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-forest text-paper font-medium px-5 py-2.5 rounded-lg hover:bg-forestdark transition disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-lg border border-forest/20 text-forest/70 hover:bg-forest/5"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <h2 className="font-display text-xl font-semibold text-forest mb-4">Your applications</h2>
        {loans.length === 0 && <p className="text-sage text-sm">No loan applications yet.</p>}
        <div className="space-y-3">
          {loans.map((loan) => (
            <div key={loan.id} className="bg-white border border-forest/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium">{Number(loan.amount_requested).toLocaleString()} XAF</p>
                  <p className="text-sm text-ink/60">{loan.purpose}</p>
                  {loan.status === "approved" && (
                    <p className="text-xs text-sage mt-1">
                      {loan.interest_rate}% interest · {loan.term_months} months
                    </p>
                  )}
                </div>
                <StatusPill status={loan.status} />
              </div>

              {loan.status === "approved" && repayments[loan.id] && (
                <div className="mt-4 pt-4 border-t border-forest/10 space-y-2">
                  {repayments[loan.id].map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink/70">
                        Installment {r.installment_number} · due {r.due_date}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{Number(r.amount_due).toLocaleString()} XAF</span>
                        <RepaymentPill status={r.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    pending: "bg-gold/15 text-gold",
    approved: "bg-forest/10 text-forest",
    declined: "bg-red-100 text-red-600",
  };
  return (
    <span className={`font-mono text-xs px-3 py-1.5 rounded-full ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

function RepaymentPill({ status }) {
  const styles = {
    upcoming: "bg-sage/15 text-sage",
    due: "bg-gold/15 text-gold",
    paid: "bg-forest/10 text-forest",
    overdue: "bg-red-100 text-red-600",
  };
  return (
    <span className={`font-mono text-[10px] px-2 py-1 rounded-full ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}