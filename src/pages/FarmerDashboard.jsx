import { useEffect, useState } from "react";
import {
  Sprout, Droplets, Wallet, ShieldCheck, MapPin, Plus,
  CheckCircle2, Circle, Clock3, Wheat, Smartphone,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import LoanApplicationWizard from "../components/LoanApplicationWizard";
import PaymentSettingsModal from "../components/PaymentSettingsModal";
import bgImage from "../assets/images/pic3.png";

export default function FarmerDashboard() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showCropNote, setShowCropNote] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

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
      .order("due_date", { ascending: true });

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
      loadRepayments(loans.filter((l) => l.status === "approved" || l.status === "disbursed").map((l) => l.id));
    }
  }, [loans]);

  const latestLoan = loans[0];
  const totalDisbursed = loans
    .filter((l) => l.status === "disbursed")
    .reduce((sum, l) => sum + Number(l.amount_requested), 0);
  const pendingCount = loans.filter((l) => l.status === "pending").length;

  const allRepayments = Object.values(repayments).flat();
  const upcomingRepayments = allRepayments
    .filter((r) => r.status !== "paid")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const hasPaymentDetails = profile?.mobile_money_number;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-forest/10 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl font-semibold text-forest">AgriLink</span>
          <div className="flex items-center gap-3">
            <NotificationBell userId={session.user.id} />
            <button onClick={signOut} className="text-sm text-sage hover:text-forest">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div
          className="rounded-2xl mb-8 px-6 py-8 md:px-8 md:py-10 flex items-end justify-between flex-wrap gap-4"
          style={{
            backgroundImage: `linear-gradient(rgba(15, 42, 30, 0.55), rgba(15, 42, 30, 0.75)), url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div>
            <p className="font-mono text-xs text-paper/70 mb-1">{today}</p>
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-paper">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Farmer"}
            </h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowPayment(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition"
            >
              <Smartphone size={16} /> Payment details
            </button>
            <button
              onClick={() => setShowCropNote(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition"
            >
              <Plus size={16} /> Add crop
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full bg-mint text-forestdark font-semibold hover:brightness-95 transition"
            >
              <Plus size={16} /> Apply for loan
            </button>
          </div>
        </div>

        {!hasPaymentDetails && (
          <div className="mb-6 bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-forest">Add your mobile money number so loans can be disbursed to you.</p>
            <button
              onClick={() => setShowPayment(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark"
            >
              Add now
            </button>
          </div>
        )}

        {showCropNote && (
          <div className="mb-6 bg-mint/10 border border-mint/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-forest">Crop tracking is coming soon — this will let you log plots and monitor yield here.</p>
            <button onClick={() => setShowCropNote(false)} className="text-sage hover:text-forest text-lg leading-none px-2">×</button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard icon={<Sprout size={18} />} label="Crop yield" value="84%" sub="Healthy · illustrative" accent="mint" />
          <MetricCard icon={<Droplets size={18} />} label="Soil moisture" value="42%" sub="Rain expected · illustrative" accent="gold" />
          <MetricCard
            icon={<Wallet size={18} />}
            label="Total disbursed"
            value={`${totalDisbursed.toLocaleString()} XAF`}
            sub="Paid to mobile money"
            accent="forest"
            mono
          />
          <MetricCard
            icon={<ShieldCheck size={18} />}
            label="Pending review"
            value={pendingCount}
            sub={pendingCount === 1 ? "loan awaiting decision" : "loans awaiting decision"}
            accent="sage"
          />
        </div>

        <div className="bg-white border border-forest/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-base font-semibold text-forest">Loan pipeline</h2>
            {latestLoan && (
              <span className="font-mono text-xs text-sage">
                {Number(latestLoan.amount_requested).toLocaleString()} XAF · {latestLoan.purpose}
              </span>
            )}
          </div>
          {!latestLoan ? (
            <p className="text-sm text-sage">No active loan applications — apply above to start the process.</p>
          ) : (
            <Pipeline status={latestLoan.status} />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 bg-white border border-forest/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-forest" />
              <h2 className="font-display text-base font-semibold text-forest">Farm plots</h2>
              <span className="font-mono text-[10px] text-sage bg-forest/5 px-2 py-0.5 rounded-full ml-1">illustrative</span>
            </div>
            <FarmPlotGrid />
          </div>

          <div className="bg-white border border-forest/10 rounded-2xl p-6">
            <h2 className="font-display text-base font-semibold text-forest mb-4">Upcoming</h2>
            {upcomingRepayments.length === 0 && (
              <p className="text-sm text-sage">No upcoming repayments.</p>
            )}
            <div className="space-y-3">
              {upcomingRepayments.map((r) => (
                <div key={r.id} className="flex items-start gap-2.5">
                  <Clock3 size={15} className="text-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-ink/80">{Number(r.amount_due).toLocaleString()} XAF due</p>
                    <p className="font-mono text-xs text-sage">{r.due_date}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2.5 pt-2 border-t border-forest/5">
                <Wheat size={15} className="text-mint mt-0.5 flex-shrink-0" />
                <p className="text-sm text-ink/60">Market prices steady this week — illustrative</p>
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <LoanApplicationWizard
            userId={session.user.id}
            onClose={() => setShowForm(false)}
            onSuccess={() => { setShowForm(false); loadLoans(); }}
          />
        )}

        {showPayment && (
          <PaymentSettingsModal
            userId={session.user.id}
            currentProvider={profile?.mobile_money_provider}
            currentNumber={profile?.mobile_money_number}
            currentHolderName={profile?.mobile_money_holder_name}
            onClose={() => setShowPayment(false)}
            onSaved={refreshProfile}
          />
        )}

        <h2 className="font-display text-xl font-semibold text-forest mb-4">Your applications</h2>
        {loans.length === 0 && <p className="text-sage text-sm">No loan applications yet.</p>}
        <div className="space-y-3">
          {loans.map((loan) => (
            <div key={loan.id} className="bg-white border border-forest/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium">{Number(loan.amount_requested).toLocaleString()} XAF</p>
                  <p className="text-sm text-ink/60">{loan.purpose}</p>
                  {(loan.status === "approved" || loan.status === "disbursed") && (
                    <p className="text-xs text-sage mt-1">
                      {loan.interest_rate}% interest · {loan.term_months} months
                    </p>
                  )}
                  {loan.status === "disbursed" && (
                    <p className="text-xs text-forest mt-1">
                      Disbursed {new Date(loan.disbursed_at).toLocaleDateString()} · ref: {loan.disbursement_reference}
                    </p>
                  )}
                </div>
                <StatusPill status={loan.status} />
              </div>

              {(loan.status === "approved" || loan.status === "disbursed") && repayments[loan.id] && (
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

function MetricCard({ icon, label, value, sub, accent, mono }) {
  const accentBg = {
    mint: "bg-mint/15 text-mint",
    gold: "bg-gold/15 text-gold",
    forest: "bg-forest/10 text-forest",
    sage: "bg-sage/15 text-sage",
  }[accent];

  return (
    <div className="bg-white border border-forest/10 rounded-2xl p-5 hover:border-forest/25 hover:-translate-y-0.5 transition">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${accentBg}`}>{icon}</div>
      <p className="text-xs text-sage mb-1">{label}</p>
      <p className={`font-display font-semibold text-forest ${mono ? "font-mono text-lg" : "text-2xl"}`}>{value}</p>
      <p className="text-[11px] text-sage/80 mt-1">{sub}</p>
    </div>
  );
}

function Pipeline({ status }) {
  const steps = [
    { key: "applied", label: "Applied", done: true },
    { key: "verified", label: "Verified", done: true },
    { key: "approved", label: "Approved", done: status === "approved" || status === "disbursed" },
    { key: "disbursed", label: "Disbursed", done: status === "disbursed" },
  ];

  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step.done ? "bg-forest text-paper" : "bg-forest/10 text-sage"}`}>
              {step.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </div>
            <span className={`text-[10px] md:text-xs font-medium whitespace-nowrap ${step.done ? "text-forest" : "text-sage"}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 ${step.done && steps[i + 1].done ? "bg-forest" : "bg-forest/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function FarmPlotGrid() {
  const plots = Array.from({ length: 24 }, (_, i) => {
    const seed = (i * 37) % 100;
    return seed > 70 ? "healthy" : seed > 40 ? "growing" : "fallow";
  });
  const plotColor = { healthy: "bg-forest", growing: "bg-mint", fallow: "bg-forest/10" };

  return (
    <div>
      <div className="grid grid-cols-8 gap-1.5 mb-4">
        {plots.map((state, i) => (
          <div key={i} className={`aspect-square rounded-md ${plotColor[state]} hover:scale-110 transition cursor-pointer`} title={state} />
        ))}
      </div>
      <div className="flex gap-4 text-xs text-sage">
        <LegendDot color="bg-forest" label="Healthy" />
        <LegendDot color="bg-mint" label="Growing" />
        <LegendDot color="bg-forest/10" label="Fallow" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}

function StatusPill({ status }) {
  const styles = {
    pending: "bg-gold/15 text-gold",
    approved: "bg-sage/15 text-sage",
    disbursed: "bg-forest/10 text-forest",
    declined: "bg-red-100 text-red-600",
  };
  return <span className={`font-mono text-xs px-3 py-1.5 rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
}

function RepaymentPill({ status }) {
  const styles = {
    upcoming: "bg-sage/15 text-sage",
    due: "bg-gold/15 text-gold",
    paid: "bg-forest/10 text-forest",
    overdue: "bg-red-100 text-red-600",
  };
  return <span className={`font-mono text-[10px] px-2 py-1 rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
}