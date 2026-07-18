import { useEffect, useState, Fragment } from "react";
import { Menu } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import LoanReviewModal from "../components/LoanReviewModal";
import OfficerSignModal from "../components/OfficerSignModal";
import { computeRiskScore, RISK_BAND_STYLES } from "../lib/riskScore";
import { sendEmail as sendEmailJS } from "../lib/sendEmail";

export default function MfiDashboard() {
  const { session, profile, signOut } = useAuth();
  const [tab, setTab] = useState("overview");
  const [loanQueue, setLoanQueue] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadLoans = async () => {
    if (!profile?.mfi_id) return;
    const { data, error } = await supabase
      .from("loan_applications")
      .select("*, profiles!loan_applications_user_id_fkey(full_name, email, mobile_money_provider, mobile_money_number, mobile_money_holder_name)")
      .eq("mfi_id", profile.mfi_id)
      .order("submitted_at", { ascending: false });
    if (error) console.error("loadLoans error:", error);
    setLoanQueue(data || []);
  };

  const loadRepayments = async () => {
    if (!profile?.mfi_id) return;
    const { data, error } = await supabase
      .from("loan_repayments")
      .select("*, loan_applications!inner(purpose, mfi_id, profiles!loan_applications_user_id_fkey(full_name, email))")
      .eq("loan_applications.mfi_id", profile.mfi_id)
      .order("due_date", { ascending: true });
    if (error) console.error("loadRepayments error:", error);
    setRepayments(data || []);
  };

  useEffect(() => {
    if (profile?.mfi_id) {
      loadLoans();
      loadRepayments();
    }
  }, [profile]);

  const sendEmail = async (to, subject, message, name) => {
    await sendEmailJS(to, name, subject, message);
  };

  const decideLoan = async (loan, decision) => {
    await supabase
      .from("loan_applications")
      .update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: session.user.id })
      .eq("id", loan.id);

    await supabase.from("notifications").insert({
      user_id: loan.user_id,
      message:
        decision === "declined"
          ? `Your loan request for ${Number(loan.amount_requested).toLocaleString()} XAF was declined.`
          : "Your loan status was updated.",
      type: decision === "declined" ? "warning" : "info",
    });

    await sendEmail(
      loan.profiles?.email,
      decision === "declined" ? "Your AgriLink loan request was declined" : "Update on your AgriLink loan",
      decision === "declined"
        ? `Your loan request for ${Number(loan.amount_requested).toLocaleString()} XAF was declined.`
        : "Your loan status was updated. Log in to view details.",
      loan.profiles?.full_name
    );

    loadLoans();
  };

  const generateSchedule = (loan, interestRate, termMonths) => {
    const principal = Number(loan.amount_requested);
    const totalWithInterest = principal * (1 + interestRate / 100);
    const monthlyAmount = Math.round(totalWithInterest / termMonths);
    const installments = [];
    const startDate = new Date();
    for (let i = 1; i <= termMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      installments.push({
        loan_id: loan.id,
        installment_number: i,
        due_date: dueDate.toISOString().split("T")[0],
        amount_due: monthlyAmount,
        status: "upcoming",
      });
    }
    return installments;
  };

  const approveLoanWithTerms = async (loan, interestRate, termMonths) => {
    await supabase
      .from("loan_applications")
      .update({
        status: "approved",
        interest_rate: interestRate,
        term_months: termMonths,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      })
      .eq("id", loan.id);

    await supabase.from("notifications").insert({
      user_id: loan.user_id,
      message: `Your loan for ${Number(loan.amount_requested).toLocaleString()} XAF was approved at ${interestRate}% over ${termMonths} months. Please log in to review and sign the loan agreement.`,
      type: "success",
    });

    await sendEmail(
      loan.profiles?.email,
      "Your AgriLink loan was approved, action needed",
      `Your loan for ${Number(loan.amount_requested).toLocaleString()} XAF was approved at ${interestRate}% interest over ${termMonths} months. Please log in to review and sign the loan agreement before funds can be disbursed.`,
      loan.profiles?.full_name
    );

    loadLoans();
  };

  const markDisbursed = async (loan, reference) => {
    await supabase
      .from("loan_applications")
      .update({
        status: "disbursed",
        disbursed_at: new Date().toISOString(),
        disbursement_reference: reference,
        disbursed_by: session.user.id,
      })
      .eq("id", loan.id);

    const schedule = generateSchedule(loan, loan.interest_rate, loan.term_months);
    await supabase.from("loan_repayments").insert(schedule);

    await supabase.from("notifications").insert({
      user_id: loan.user_id,
      message: `${Number(loan.amount_requested).toLocaleString()} XAF was disbursed to your ${loan.profiles?.mobile_money_provider || "mobile money"} number. Reference: ${reference}.`,
      type: "success",
    });

    const disbursementDate = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const scheduleText = schedule
      .map((s) => `Installment ${s.installment_number}: ${s.amount_due.toLocaleString()} XAF, due ${s.due_date}`)
      .join("\n");

    await sendEmail(
      loan.profiles?.email,
      "Your AgriLink loan has been disbursed",
      `${Number(loan.amount_requested).toLocaleString()} XAF was sent to your ${loan.profiles?.mobile_money_provider || "mobile money"} number ${loan.profiles?.mobile_money_number || ""}.

Disbursement date: ${disbursementDate}
Reference: ${reference}

REPAYMENT SCHEDULE

${scheduleText}

Log in to AgriLink to track your repayments.`,
      loan.profiles?.full_name
    );

    loadLoans();
    loadRepayments();
  };

  const recordPayment = async (repayment, amountPaid, reference) => {
    await supabase
      .from("loan_repayments")
      .update({ amount_paid: amountPaid, status: "paid", paid_at: new Date().toISOString(), payment_reference: reference })
      .eq("id", repayment.id);

    const loan = loanQueue.find((l) => l.id === repayment.loan_id);
    if (loan) {
      await supabase.from("notifications").insert({
        user_id: loan.user_id,
        message: `Payment of ${amountPaid.toLocaleString()} XAF for installment #${repayment.installment_number} was recorded. Ref: ${reference || "none"}.`,
        type: "success",
      });
    }

    loadRepayments();
  };

  const pendingLoans = loanQueue.filter((l) => l.status === "pending").length;
  const awaitingDisbursement = loanQueue.filter((l) => l.status === "approved" && l.officer_signature).length;
  const totalDisbursed = loanQueue.filter((l) => l.status === "disbursed").reduce((sum, l) => sum + Number(l.amount_requested), 0);
  const uniqueFarmers = new Set(loanQueue.map((l) => l.user_id)).size;
  const dueOrOverdue = repayments.filter((r) => r.status !== "paid" && new Date(r.due_date) <= new Date()).length;

  const goTab = (t) => {
    setTab(t);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-paper flex">
      <div className="hidden md:block">
        <Sidebar tab={tab} setTab={goTab} pendingLoans={pendingLoans} dueOrOverdue={dueOrOverdue} />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">
            <Sidebar tab={tab} setTab={goTab} pendingLoans={pendingLoans} dueOrOverdue={dueOrOverdue} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar email={session?.user?.email} onSignOut={signOut} tab={tab} onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-auto">
          {tab === "overview" && (
            <Overview
              uniqueFarmers={uniqueFarmers}
              pendingLoans={pendingLoans}
              awaitingDisbursement={awaitingDisbursement}
              totalDisbursed={totalDisbursed}
              loanQueue={loanQueue}
              setTab={goTab}
            />
          )}
          {tab === "loans" && (
            <LoansTable
              loanQueue={loanQueue}
              onApprove={approveLoanWithTerms}
              onDecline={decideLoan}
              onDisburse={markDisbursed}
              officerEmail={session?.user?.email}
              reloadLoans={loadLoans}
            />
          )}
          {tab === "repayments" && <RepaymentsTable repayments={repayments} onRecordPayment={recordPayment} />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, pendingLoans, dueOrOverdue }) {
  const items = [
    { key: "overview", label: "Overview", badge: 0 },
    { key: "loans", label: "Loan Approvals", badge: pendingLoans },
    { key: "repayments", label: "Repayments", badge: dueOrOverdue },
  ];

  return (
    <aside className="w-60 h-full bg-forestdark flex-shrink-0 flex flex-col">
      <div className="px-6 py-6 border-b border-paper/10">
        <span className="font-display text-xl font-semibold text-paper">AgriLink</span>
        <p className="font-mono text-[10px] text-gold tracking-widest mt-1">MFI DASHBOARD</p>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === item.key ? "bg-paper/10 text-paper" : "text-paper/50 hover:text-paper/80 hover:bg-paper/5"
            }`}
          >
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span className="bg-gold text-forestdark text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-paper/10">
        <p className="font-mono text-[10px] text-paper/30">v1.0 MFI portal</p>
      </div>
    </aside>
  );
}

function TopBar({ email, onSignOut, tab, onMenuClick }) {
  const titles = { overview: "Overview", loans: "Loan Approvals", repayments: "Repayments" };
  return (
    <header className="border-b border-forest/10 bg-white px-4 md:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-forest">
          <Menu size={22} />
        </button>
        <h1 className="font-display text-base md:text-lg font-semibold text-forest">{titles[tab]}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <span className="hidden sm:inline font-mono text-xs text-sage">{email}</span>
        <button onClick={onSignOut} className="text-xs font-medium px-3 py-1.5 rounded-full border border-forest/20 text-forest/70 hover:bg-forest/5">
          Log out
        </button>
      </div>
    </header>
  );
}

function Overview({ uniqueFarmers, pendingLoans, awaitingDisbursement, totalDisbursed, loanQueue, setTab }) {
  const avgRiskScore = loanQueue.length > 0 ? Math.round(loanQueue.reduce((sum, l) => sum + computeRiskScore(l).score, 0) / loanQueue.length) : 0;
  const recentActivity = [...loanQueue].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 6);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatTile label="Applicants" value={uniqueFarmers} />
        <StatTile label="Pending loans" value={pendingLoans} accent={pendingLoans > 0 ? "gold" : null} onClick={() => setTab("loans")} />
        <StatTile label="Ready to disburse" value={awaitingDisbursement} accent={awaitingDisbursement > 0 ? "gold" : null} onClick={() => setTab("loans")} />
        <StatTile label="Total disbursed" value={`${totalDisbursed.toLocaleString()} XAF`} mono />
        <StatTile label="Avg. risk score" value={`${avgRiskScore}/100`} mono />
      </div>

      <h2 className="font-display text-base font-semibold text-forest mb-3">Recent activity</h2>
      <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
        {recentActivity.length === 0 && <p className="text-sage text-sm px-5 py-6">No loan applications yet.</p>}
        {recentActivity.map((item, i) => (
          <div key={item.id} className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 ${i !== 0 ? "border-t border-forest/5" : ""}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(item.status)}`} />
            <span className="text-sm text-ink/80 flex-1 truncate">
              Loan application from {item.profiles?.full_name || item.profiles?.email}
            </span>
            <span className="font-mono text-xs text-sage flex-shrink-0">{new Date(item.submitted_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusDot(status) {
  if (status === "pending") return "bg-gold";
  if (status === "approved" || status === "disbursed") return "bg-forest";
  return "bg-red-400";
}

function StatTile({ label, value, accent, mono, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white border border-forest/10 rounded-xl p-3 md:p-5 ${onClick ? "cursor-pointer hover:border-forest/25 transition" : ""}`}>
      <p className="text-[11px] md:text-xs text-sage mb-1 md:mb-2">{label}</p>
      <p className={`font-display font-semibold text-forest ${accent === "gold" ? "text-gold" : "text-forest"} ${mono ? "font-mono text-sm md:text-lg" : "text-lg md:text-2xl"}`}>{value}</p>
    </div>
  );
}

function LoansTable({ loanQueue, onApprove, onDecline, onDisburse, officerEmail, reloadLoans }) {
  const [reviewing, setReviewing] = useState(null);
  const [signing, setSigning] = useState(null);
  const [disbursingId, setDisbursingId] = useState(null);
  const [reference, setReference] = useState("");

  return (
    <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-forest/10 text-left text-xs text-sage">
              <th className="w-1"></th>
              <th className="px-5 py-3 font-medium">Farmer</th>
              <th className="px-5 py-3 font-medium">Purpose</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
              <th className="px-5 py-3 font-medium text-right">Risk score</th>
              <th className="px-5 py-3 font-medium text-right">Mobile money</th>
              <th className="px-5 py-3 font-medium text-right">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loanQueue.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sage text-sm">No loan applications yet.</td>
              </tr>
            )}
            {loanQueue.map((l) => (
              <Fragment key={l.id}>
                <tr className="border-b border-forest/5">
                  <td className={`w-1 ${railColor(l.status)}`}></td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{l.profiles?.full_name || l.profiles?.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink/70">{l.purpose}</td>
                  <td className="px-5 py-3.5 text-right font-mono">{Number(l.amount_requested).toLocaleString()} XAF</td>
                  <td className="px-5 py-3.5 text-right"><RiskBadge loan={l} /></td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-sage">
                    {l.profiles?.mobile_money_number
                      ? `${l.profiles.mobile_money_provider} ${l.profiles.mobile_money_number} (${l.profiles.mobile_money_holder_name || "no name"})`
                      : "not set"}
                  </td>
                  <td className="px-5 py-3.5 text-right"><StatusBadge status={l.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setReviewing(l)} className="text-xs font-medium px-3 py-1.5 rounded-full border border-forest/20 text-forest hover:bg-forest/5">
                        Review
                      </button>

                      {l.status === "approved" && !l.farmer_signature && (
                        <span className="text-xs text-sage px-3 py-1.5">Awaiting signature</span>
                      )}

                      {l.status === "approved" && l.farmer_signature && !l.officer_signature && (
                        <button onClick={() => setSigning(l)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark">
                          Countersign
                        </button>
                      )}

                      {l.status === "approved" && l.officer_signature && (
                        <button
                          onClick={() => {
                            const isOpen = disbursingId === l.id;
                            setDisbursingId(isOpen ? null : l.id);
                            if (!isOpen) setReference(generateReference(l.profiles?.mobile_money_provider));
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark"
                        >
                          Mark disbursed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {disbursingId === l.id && (
                  <tr className="border-b border-forest/5 bg-forest/[0.015]">
                    <td></td>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="flex items-end gap-4 flex-wrap">
                        <label className="block flex-1 max-w-xs">
                          <span className="text-xs font-medium text-ink/70 mb-1 block">
                            Mobile money reference (auto-generated, edit if you have the real one)
                          </span>
                          <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="e.g. MTN-TXN-48213"
                            className="w-full border border-forest/20 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </label>
                        <button
                          onClick={() => { onDisburse(l, reference); setDisbursingId(null); }}
                          disabled={!reference.trim()}
                          className="text-xs font-medium px-4 py-2 rounded-full bg-forest text-paper hover:bg-forestdark disabled:opacity-50"
                        >
                          Confirm disbursed
                        </button>
                        <button onClick={() => setDisbursingId(null)} className="text-xs font-medium px-3 py-2 rounded-full border border-forest/20 text-forest/70">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {reviewing && (
        <LoanReviewModal loan={reviewing} onClose={() => setReviewing(null)} onApprove={onApprove} onDecline={(l) => onDecline(l, "declined")} />
      )}

      {signing && (
        <OfficerSignModal loan={signing} officerName={officerEmail} onClose={() => setSigning(null)} onSigned={reloadLoans} />
      )}
    </div>
  );
}

function RiskBadge({ loan }) {
  const { score, maxScore, band } = computeRiskScore(loan);
  const style = RISK_BAND_STYLES[band];
  return (
    <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full ${style.className}`}>
      {score}/{maxScore} {style.label}
    </span>
  );
}

function generateReference(provider) {
  const prefix = provider === "MTN" ? "MTN" : provider === "Orange" ? "ORG" : "TXN";
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-TXN-${random}`;
}

function RepaymentsTable({ repayments, onRecordPayment }) {
  const [payingFor, setPayingFor] = useState(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const computeStatus = (r) => {
    if (r.status === "paid") return "paid";
    const due = new Date(r.due_date);
    const today = new Date();
    const daysUntil = (due - today) / (1000 * 60 * 60 * 24);
    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 7) return "due";
    return "upcoming";
  };

  const startPayment = (r) => {
    setPayingFor(r.id);
    setAmount(String(r.amount_due));
    setReference("");
  };

  return (
    <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-forest/10 text-left text-xs text-sage">
              <th className="w-1"></th>
              <th className="px-5 py-3 font-medium">Farmer</th>
              <th className="px-5 py-3 font-medium">Installment</th>
              <th className="px-5 py-3 font-medium">Due date</th>
              <th className="px-5 py-3 font-medium text-right">Amount due</th>
              <th className="px-5 py-3 font-medium text-right">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {repayments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sage text-sm">No repayment schedules yet.</td>
              </tr>
            )}
            {repayments.map((r) => {
              const status = computeStatus(r);
              return (
                <Fragment key={r.id}>
                  <tr className="border-b border-forest/5">
                    <td className={`w-1 ${repaymentRailColor(status)}`}></td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{r.loan_applications?.profiles?.full_name || r.loan_applications?.profiles?.email}</p>
                      <p className="text-xs text-sage">{r.loan_applications?.purpose}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink/70">#{r.installment_number}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-sage">{r.due_date}</td>
                    <td className="px-5 py-3.5 text-right font-mono">{Number(r.amount_due).toLocaleString()} XAF</td>
                    <td className="px-5 py-3.5 text-right"><RepaymentStatusBadge status={status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      {status !== "paid" && (
                        <button onClick={() => startPayment(r)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark">
                          Record payment
                        </button>
                      )}
                      {status === "paid" && (
                        <span className="font-mono text-xs text-sage">
                          {new Date(r.paid_at).toLocaleDateString()} {r.payment_reference || "no ref"}
                        </span>
                      )}
                    </td>
                  </tr>
                  {payingFor === r.id && (
                    <tr className="border-b border-forest/5 bg-forest/[0.015]">
                      <td></td>
                      <td colSpan={6} className="px-5 py-4">
                        <div className="flex items-end gap-4 flex-wrap">
                          <label className="block">
                            <span className="text-xs font-medium text-ink/70 mb-1 block">Amount received (XAF)</span>
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-36 border border-forest/20 rounded-lg px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium text-ink/70 mb-1 block">Mobile money reference</span>
                            <input
                              type="text"
                              value={reference}
                              onChange={(e) => setReference(e.target.value)}
                              placeholder="e.g. MTN-TXN-58213"
                              className="w-48 border border-forest/20 rounded-lg px-3 py-1.5 text-sm"
                            />
                          </label>
                          <button
                            onClick={() => { onRecordPayment(r, Number(amount), reference); setPayingFor(null); }}
                            className="text-xs font-medium px-4 py-2 rounded-full bg-forest text-paper hover:bg-forestdark"
                          >
                            Confirm payment
                          </button>
                          <button onClick={() => setPayingFor(null)} className="text-xs font-medium px-3 py-2 rounded-full border border-forest/20 text-forest/70">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RepaymentStatusBadge({ status }) {
  const styles = {
    upcoming: "bg-sage/15 text-sage",
    due: "bg-gold/15 text-gold",
    paid: "bg-forest/10 text-forest",
    overdue: "bg-red-100 text-red-600",
  };
  return <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
}

function repaymentRailColor(status) {
  if (status === "paid") return "bg-forest";
  if (status === "overdue") return "bg-red-400";
  if (status === "due") return "bg-gold";
  return "bg-sage/40";
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-gold/15 text-gold",
    approved: "bg-sage/15 text-sage",
    disbursed: "bg-forest/10 text-forest",
    denied: "bg-red-100 text-red-600",
    declined: "bg-red-100 text-red-600",
  };
  return <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
}

function railColor(status) {
  if (status === "pending") return "bg-gold";
  if (status === "approved" || status === "disbursed") return "bg-forest";
  return "bg-red-400";
}