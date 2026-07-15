import LoanReviewModal from "../components/LoanReviewModal";
import { useEffect, useState, Fragment } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import KycReviewModal from "../components/KycReviewModal";

export default function AdminControlCentre() {
  const { session, signOut } = useAuth();
  const [tab, setTab] = useState("overview");
  const [kycQueue, setKycQueue] = useState([]);
  const [loanQueue, setLoanQueue] = useState([]);
  const [repayments, setRepayments] = useState([]);

  const loadKyc = async () => {
    const { data, error } = await supabase
      .from("kyc_submissions")
      .select("*, profiles!kyc_submissions_user_id_fkey(email)")
      .order("submitted_at", { ascending: false });
    if (error) console.error("loadKyc error:", error);
    setKycQueue(data || []);
  };

  const loadLoans = async () => {
    const { data, error } = await supabase
      .from("loan_applications")
      .select("*, profiles!loan_applications_user_id_fkey(full_name, email)")
      .order("submitted_at", { ascending: false });
    if (error) console.error("loadLoans error:", error);
    setLoanQueue(data || []);
  };

  const loadRepayments = async () => {
    const { data, error } = await supabase
      .from("loan_repayments")
      .select("*, loan_applications(purpose, profiles!loan_applications_user_id_fkey(full_name, email))")
      .order("due_date", { ascending: true });
    if (error) console.error("loadRepayments error:", error);
    setRepayments(data || []);
  };

  useEffect(() => {
    loadKyc();
    loadLoans();
    loadRepayments();
  }, []);

  const sendEmail = async (to, subject, message) => {
    if (!to) return;
    try {
      await supabase.functions.invoke("send-notification-email", {
        body: { to, subject, message },
      });
    } catch (err) {
      console.error("Email send failed:", err);
    }
  };

  const decideKyc = async (submission, decision) => {
    await supabase
      .from("kyc_submissions")
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      })
      .eq("id", submission.id);
    await supabase
      .from("profiles")
      .update({ kyc_status: decision })
      .eq("id", submission.user_id);

    await supabase.from("notifications").insert({
      user_id: submission.user_id,
      message:
        decision === "approved"
          ? "Your identity verification was approved. You can now apply for a loan."
          : "Your identity verification was not approved. Please review and resubmit your documents.",
      type: decision === "approved" ? "success" : "warning",
    });

    await sendEmail(
      submission.profiles?.email,
      decision === "approved" ? "Your AgriLink verification was approved" : "Your AgriLink verification needs attention",
      decision === "approved"
        ? "Good news — your identity verification was approved. You can now log in and apply for a loan."
        : "Your identity verification was not approved this time. Please log in, review your submitted documents, and resubmit."
    );

    loadKyc();
  };

  const decideLoan = async (loan, decision) => {
    await supabase
      .from("loan_applications")
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      })
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
        : "Your loan status was updated. Log in to view details."
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
        disbursed_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id,
      })
      .eq("id", loan.id);

    const schedule = generateSchedule(loan, interestRate, termMonths);
    await supabase.from("loan_repayments").insert(schedule);

    await supabase.from("notifications").insert({
      user_id: loan.user_id,
      message: `Your loan for ${Number(loan.amount_requested).toLocaleString()} XAF was approved at ${interestRate}% over ${termMonths} months.`,
      type: "success",
    });

    await sendEmail(
      loan.profiles?.email,
      "Your AgriLink loan was approved",
      `Your loan for ${Number(loan.amount_requested).toLocaleString()} XAF was approved at ${interestRate}% interest over ${termMonths} months. Log in to view your repayment schedule.`
    );

    loadLoans();
    loadRepayments();
  };

  const recordPayment = async (repayment, amountPaid) => {
    await supabase
      .from("loan_repayments")
      .update({
        amount_paid: amountPaid,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", repayment.id);

    const loan = loanQueue.find((l) => l.id === repayment.loan_id);
    if (loan) {
      await supabase.from("notifications").insert({
        user_id: loan.user_id,
        message: `Payment of ${amountPaid.toLocaleString()} XAF for installment #${repayment.installment_number} was recorded.`,
        type: "success",
      });
    }

    loadRepayments();
  };

  const pendingKyc = kycQueue.filter((k) => k.status === "pending").length;
  const pendingLoans = loanQueue.filter((l) => l.status === "pending").length;
  const totalDisbursed = loanQueue
    .filter((l) => l.status === "approved")
    .reduce((sum, l) => sum + Number(l.amount_requested), 0);
  const uniqueFarmers = new Set(kycQueue.map((k) => k.user_id)).size;
  const dueOrOverdue = repayments.filter(
    (r) => r.status !== "paid" && new Date(r.due_date) <= new Date()
  ).length;

  return (
    <div className="min-h-screen bg-paper flex">
      <Sidebar
        tab={tab}
        setTab={setTab}
        pendingKyc={pendingKyc}
        pendingLoans={pendingLoans}
        dueOrOverdue={dueOrOverdue}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar email={session?.user?.email} onSignOut={signOut} tab={tab} />

        <main className="flex-1 px-8 py-8 overflow-auto">
          {tab === "overview" && (
            <Overview
              uniqueFarmers={uniqueFarmers}
              pendingKyc={pendingKyc}
              pendingLoans={pendingLoans}
              totalDisbursed={totalDisbursed}
              kycQueue={kycQueue}
              loanQueue={loanQueue}
              setTab={setTab}
            />
          )}
          {tab === "kyc" && (
            <KycTable kycQueue={kycQueue} onApprove={decideKyc} onDeny={decideKyc} />
          )}
          {tab === "loans" && (
            <LoansTable loanQueue={loanQueue} onApprove={approveLoanWithTerms} onDecline={decideLoan} />
          )}
          {tab === "repayments" && (
            <RepaymentsTable repayments={repayments} onRecordPayment={recordPayment} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- Sidebar ---------- */

function Sidebar({ tab, setTab, pendingKyc, pendingLoans, dueOrOverdue }) {
  const items = [
    { key: "overview", label: "Overview", icon: "◫" },
    { key: "kyc", label: "KYC Review", icon: "◈", badge: pendingKyc },
    { key: "loans", label: "Loan Approvals", icon: "◇", badge: pendingLoans },
    { key: "repayments", label: "Repayments", icon: "◆", badge: dueOrOverdue },
  ];

  return (
    <aside className="w-60 bg-forestdark flex-shrink-0 flex flex-col">
      <div className="px-6 py-6 border-b border-paper/10">
        <span className="font-display text-xl font-semibold text-paper">AgriLink</span>
        <p className="font-mono text-[10px] text-gold tracking-widest mt-1">CONTROL CENTRE</p>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === item.key
                ? "bg-paper/10 text-paper"
                : "text-paper/50 hover:text-paper/80 hover:bg-paper/5"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </span>
            {item.badge > 0 && (
              <span className="bg-gold text-forestdark text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-paper/10">
        <p className="font-mono text-[10px] text-paper/30">v0.8 prototype</p>
      </div>
    </aside>
  );
}

/* ---------- Top bar ---------- */

function TopBar({ email, onSignOut, tab }) {
  const titles = { overview: "Overview", kyc: "KYC Review", loans: "Loan Approvals", repayments: "Repayments" };
  return (
    <header className="border-b border-forest/10 bg-white px-8 py-4 flex items-center justify-between">
      <h1 className="font-display text-lg font-semibold text-forest">{titles[tab]}</h1>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-sage">{email}</span>
        <button
          onClick={onSignOut}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-forest/20 text-forest/70 hover:bg-forest/5"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

/* ---------- Overview ---------- */

function Overview({ uniqueFarmers, pendingKyc, pendingLoans, totalDisbursed, kycQueue, loanQueue, setTab }) {
  const recentActivity = [...kycQueue, ...loanQueue]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 6);

  const growthData = buildGrowthData(kycQueue);
  const volumeData = buildVolumeData(loanQueue);
  const funnelData = buildFunnelData(kycQueue);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatTile label="Registered farmers" value={uniqueFarmers} />
        <StatTile label="Pending KYC" value={pendingKyc} accent={pendingKyc > 0 ? "gold" : null} onClick={() => setTab("kyc")} />
        <StatTile label="Pending loans" value={pendingLoans} accent={pendingLoans > 0 ? "gold" : null} onClick={() => setTab("loans")} />
        <StatTile label="Total disbursed" value={`${totalDisbursed.toLocaleString()} XAF`} mono />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <ChartCard title="Farmer growth" span={2}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B443215" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7A6F" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7A6F" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #1B443220" }} />
              <Line type="monotone" dataKey="cumulative" stroke="#1B4332" strokeWidth={2} dot={false} name="Total farmers" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="KYC funnel">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B443215" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7A6F" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7A6F" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #1B443220" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mb-8">
        <ChartCard title="Loan volume by month">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B443215" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7A6F" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7A6F" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #1B443220" }}
                formatter={(value) => [`${Number(value).toLocaleString()} XAF`, "Disbursed"]}
              />
              <Bar dataKey="amount" fill="#C9A45C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <h2 className="font-display text-base font-semibold text-forest mb-3">Recent activity</h2>
      <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
        {recentActivity.length === 0 && (
          <p className="text-sage text-sm px-5 py-6">No activity yet.</p>
        )}
        {recentActivity.map((item, i) => {
          const isKyc = "national_id" in item;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 px-5 py-3 ${i !== 0 ? "border-t border-forest/5" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot(item.status)}`} />
              <span className="text-sm text-ink/80 flex-1">
                {isKyc ? "KYC submission" : "Loan application"} ·{" "}
                {item.full_name || item.profiles?.full_name || item.profiles?.email}
              </span>
              <span className="font-mono text-xs text-sage">
                {new Date(item.submitted_at).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({ title, children, span }) {
  return (
    <div className={`bg-white border border-forest/10 rounded-xl p-5 ${span === 2 ? "col-span-2" : ""}`}>
      <p className="text-xs text-sage mb-3">{title}</p>
      {children}
    </div>
  );
}

function buildGrowthData(kycQueue) {
  const sorted = [...kycQueue].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  let cumulative = 0;
  const seen = new Set();
  const points = [];
  sorted.forEach((k) => {
    if (seen.has(k.user_id)) return;
    seen.add(k.user_id);
    cumulative += 1;
    points.push({
      date: new Date(k.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      cumulative,
    });
  });
  return points;
}

function buildVolumeData(loanQueue) {
  const approved = loanQueue.filter((l) => l.status === "approved");
  const byMonth = {};
  approved.forEach((l) => {
    const d = new Date(l.disbursed_at || l.submitted_at);
    const key = d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    byMonth[key] = (byMonth[key] || 0) + Number(l.amount_requested);
  });
  return Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));
}

function buildFunnelData(kycQueue) {
  const pending = kycQueue.filter((k) => k.status === "pending").length;
  const approved = kycQueue.filter((k) => k.status === "approved").length;
  const denied = kycQueue.filter((k) => k.status === "denied").length;
  return [
    { name: "Pending", count: pending, color: "#C9A45C" },
    { name: "Approved", count: approved, color: "#1B4332" },
    { name: "Denied", count: denied, color: "#f87171" },
  ];
}

function statusDot(status) {
  if (status === "pending") return "bg-gold";
  if (status === "approved") return "bg-forest";
  return "bg-red-400";
}

function StatTile({ label, value, accent, mono, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-forest/10 rounded-xl p-5 ${onClick ? "cursor-pointer hover:border-forest/25 transition" : ""}`}
    >
      <p className="text-xs text-sage mb-2">{label}</p>
      <p className={`font-display text-2xl font-semibold ${accent === "gold" ? "text-gold" : "text-forest"} ${mono ? "font-mono text-xl" : ""}`}>
        {value}
      </p>
    </div>
  );
}

/* ---------- KYC table ---------- */

function KycTable({ kycQueue, onApprove, onDeny }) {
  const [reviewing, setReviewing] = useState(null);

  return (
    <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-forest/10 text-left text-xs text-sage">
            <th className="w-1"></th>
            <th className="px-5 py-3 font-medium">Farmer</th>
            <th className="px-5 py-3 font-medium">Crop / farm</th>
            <th className="px-5 py-3 font-medium">Region</th>
            <th className="px-5 py-3 font-medium">Submitted</th>
            <th className="px-5 py-3 font-medium text-right">Status</th>
            <th className="px-5 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {kycQueue.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-sage text-sm">
                No KYC submissions yet.
              </td>
            </tr>
          )}
          {kycQueue.map((k) => (
            <tr key={k.id} className="border-b border-forest/5 hover:bg-forest/[0.02]">
              <td className={`w-1 ${railColor(k.status)}`}></td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-ink">{k.full_name}</p>
                <p className="font-mono text-xs text-sage">{k.profiles?.email}</p>
              </td>
              <td className="px-5 py-3.5 text-ink/70">{k.crop} · {k.farm_size}</td>
              <td className="px-5 py-3.5 text-ink/70">{k.region}</td>
              <td className="px-5 py-3.5 font-mono text-xs text-sage">
                {new Date(k.submitted_at).toLocaleDateString()}
              </td>
              <td className="px-5 py-3.5 text-right">
                <StatusBadge status={k.status} />
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => setReviewing(k)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark"
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {reviewing && (
        <KycReviewModal
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onApprove={(k) => onApprove(k, "approved")}
          onDeny={(k) => onDeny(k, "denied")}
        />
      )}
    </div>
  );
}

/* ---------- Loans table ---------- */

function LoansTable({ loanQueue, onApprove, onDecline }) {
  const [reviewing, setReviewing] = useState(null);

  return (
    <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-forest/10 text-left text-xs text-sage">
            <th className="w-1"></th>
            <th className="px-5 py-3 font-medium">Farmer</th>
            <th className="px-5 py-3 font-medium">Purpose</th>
            <th className="px-5 py-3 font-medium text-right">Amount</th>
            <th className="px-5 py-3 font-medium text-right">Terms</th>
            <th className="px-5 py-3 font-medium text-right">Status</th>
            <th className="px-5 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {loanQueue.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-sage text-sm">
                No loan applications yet.
              </td>
            </tr>
          )}
          {loanQueue.map((l) => (
            <tr key={l.id} className="border-b border-forest/5 hover:bg-forest/[0.02]">
              <td className={`w-1 ${railColor(l.status)}`}></td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-ink">{l.profiles?.full_name || l.profiles?.email}</p>
              </td>
              <td className="px-5 py-3.5 text-ink/70">{l.purpose}</td>
              <td className="px-5 py-3.5 text-right font-mono">
                {Number(l.amount_requested).toLocaleString()} XAF
              </td>
              <td className="px-5 py-3.5 text-right font-mono text-xs text-sage">
                {l.status === "approved" ? `${l.interest_rate}% · ${l.term_months}mo` : "—"}
              </td>
              <td className="px-5 py-3.5 text-right">
                <StatusBadge status={l.status} />
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => setReviewing(l)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark"
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {reviewing && (
        <LoanReviewModal
          loan={reviewing}
          onClose={() => setReviewing(null)}
          onApprove={onApprove}
          onDecline={(l) => onDecline(l, "declined")}
        />
      )}
    </div>
  );
}

/* ---------- Repayments table ---------- */

function RepaymentsTable({ repayments, onRecordPayment }) {
  const [payingFor, setPayingFor] = useState(null);
  const [amount, setAmount] = useState("");

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
  };

  return (
    <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
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
              <td colSpan={7} className="px-5 py-8 text-center text-sage text-sm">
                No repayment schedules yet — approve a loan with terms to generate one.
              </td>
            </tr>
          )}
          {repayments.map((r) => {
            const status = computeStatus(r);
            return (
              <Fragment key={r.id}>
                <tr className="border-b border-forest/5">
                  <td className={`w-1 ${repaymentRailColor(status)}`}></td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">
                      {r.loan_applications?.profiles?.full_name || r.loan_applications?.profiles?.email}
                    </p>
                    <p className="text-xs text-sage">{r.loan_applications?.purpose}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink/70">#{r.installment_number}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-sage">{r.due_date}</td>
                  <td className="px-5 py-3.5 text-right font-mono">
                    {Number(r.amount_due).toLocaleString()} XAF
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <RepaymentStatusBadge status={status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {status !== "paid" && (
                      <button
                        onClick={() => startPayment(r)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark"
                      >
                        Record payment
                      </button>
                    )}
                    {status === "paid" && (
                      <span className="font-mono text-xs text-sage">
                        {new Date(r.paid_at).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
                {payingFor === r.id && (
                  <tr className="border-b border-forest/5 bg-forest/[0.015]">
                    <td></td>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="flex items-end gap-4">
                        <label className="block">
                          <span className="text-xs font-medium text-ink/70 mb-1 block">Amount received (XAF)</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-36 border border-forest/20 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </label>
                        <button
                          onClick={() => { onRecordPayment(r, Number(amount)); setPayingFor(null); }}
                          className="text-xs font-medium px-4 py-2 rounded-full bg-forest text-paper hover:bg-forestdark"
                        >
                          Confirm payment
                        </button>
                        <button
                          onClick={() => setPayingFor(null)}
                          className="text-xs font-medium px-3 py-2 rounded-full border border-forest/20 text-forest/70"
                        >
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
  );
}

function RepaymentStatusBadge({ status }) {
  const styles = {
    upcoming: "bg-sage/15 text-sage",
    due: "bg-gold/15 text-gold",
    paid: "bg-forest/10 text-forest",
    overdue: "bg-red-100 text-red-600",
  };
  return (
    <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
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
    approved: "bg-forest/10 text-forest",
    denied: "bg-red-100 text-red-600",
    declined: "bg-red-100 text-red-600",
  };
  return (
    <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

function railColor(status) {
  if (status === "pending") return "bg-gold";
  if (status === "approved") return "bg-forest";
  return "bg-red-400";
}