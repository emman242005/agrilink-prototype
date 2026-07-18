import AdminLoanDetailModal from "../components/AdminLoanDetailModal";
import { useEffect, useState, Fragment } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Menu } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import KycReviewModal from "../components/KycReviewModal";
import { computeRiskScore, RISK_BAND_STYLES } from "../lib/riskScore";
import { sendEmail as sendEmailJS } from "../lib/sendEmail";

export default function AdminControlCentre() {
  const { session, signOut } = useAuth();
  const [tab, setTab] = useState("overview");
  const [kycQueue, setKycQueue] = useState([]);
  const [loanQueue, setLoanQueue] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [mfiQueue, setMfiQueue] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      .select("*, profiles!loan_applications_user_id_fkey(full_name, email), mfis(name)")
      .order("submitted_at", { ascending: false });
    if (error) console.error("loadLoans error:", error);
    setLoanQueue(data || []);
  };

  const loadRepayments = async () => {
    const { data, error } = await supabase
      .from("loan_repayments")
      .select("*, loan_applications(purpose, profiles!loan_applications_user_id_fkey(full_name, email), mfis(name))")
      .order("due_date", { ascending: true });
    if (error) console.error("loadRepayments error:", error);
    setRepayments(data || []);
  };

  const loadMfis = async () => {
    const { data, error } = await supabase
      .from("mfis")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) console.error("loadMfis error:", error);
    setMfiQueue(data || []);
  };

  useEffect(() => {
    loadKyc();
    loadLoans();
    loadRepayments();
    loadMfis();
  }, []);

  const sendEmail = async (to, subject, message, name) => {
    await sendEmailJS(to, name, subject, message);
  };

  const decideKyc = async (submission, decision) => {
    await supabase
      .from("kyc_submissions")
      .update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: session.user.id })
      .eq("id", submission.id);
    await supabase.from("profiles").update({ kyc_status: decision }).eq("id", submission.user_id);

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
        ? "Good news, your identity verification was approved. You can now log in and apply for a loan."
        : "Your identity verification was not approved this time. Please log in, review your submitted documents, and resubmit.",
      submission.full_name
    );

    loadKyc();
  };

  const decideMfi = async (mfi, decision) => {
    await supabase
      .from("mfis")
      .update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: session.user.id })
      .eq("id", mfi.id);

    await sendEmail(
      mfi.contact_email,
      decision === "approved" ? "Your AgriLink MFI registration was approved" : "Update on your AgriLink MFI registration",
      decision === "approved"
        ? `Good news, ${mfi.name} has been approved as an AgriLink lending partner. Log in to access your dashboard.`
        : `Your registration for ${mfi.name} was not approved at this time. Please contact AgriLink for more details.`
    );

    loadMfis();
  };

  const pendingKyc = kycQueue.filter((k) => k.status === "pending").length;
  const pendingMfis = mfiQueue.filter((m) => m.status === "pending").length;
  const totalDisbursed = loanQueue.filter((l) => l.status === "disbursed").reduce((sum, l) => sum + Number(l.amount_requested), 0);
  const uniqueFarmers = new Set(kycQueue.map((k) => k.user_id)).size;
  const activeMfis = mfiQueue.filter((m) => m.status === "approved").length;

  const goTab = (t) => {
    setTab(t);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-paper flex">
      <div className="hidden md:block">
        <Sidebar tab={tab} setTab={goTab} pendingKyc={pendingKyc} pendingMfis={pendingMfis} />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">
            <Sidebar tab={tab} setTab={goTab} pendingKyc={pendingKyc} pendingMfis={pendingMfis} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar email={session?.user?.email} onSignOut={signOut} tab={tab} onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-auto">
          {tab === "overview" && (
            <Overview
              uniqueFarmers={uniqueFarmers}
              pendingKyc={pendingKyc}
              activeMfis={activeMfis}
              pendingMfis={pendingMfis}
              totalDisbursed={totalDisbursed}
              kycQueue={kycQueue}
              loanQueue={loanQueue}
              setTab={goTab}
            />
          )}
          {tab === "mfis" && <MfiTable mfiQueue={mfiQueue} onApprove={decideMfi} onDeny={decideMfi} />}
          {tab === "kyc" && <KycTable kycQueue={kycQueue} onApprove={decideKyc} onDeny={decideKyc} />}
          {tab === "loans" && <LoansMonitor loanQueue={loanQueue} />}
          {tab === "repayments" && <RepaymentsMonitor repayments={repayments} />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, pendingKyc, pendingMfis }) {
  const items = [
    { key: "overview", label: "Overview", badge: 0 },
    { key: "mfis", label: "MFI Applications", badge: pendingMfis },
    { key: "kyc", label: "KYC Review", badge: pendingKyc },
    { key: "loans", label: "Network Loans", badge: 0 },
    { key: "repayments", label: "Network Repayments", badge: 0 },
  ];

  return (
    <aside className="w-60 h-full bg-forestdark flex-shrink-0 flex flex-col">
      <div className="px-6 py-6 border-b border-paper/10">
        <span className="font-display text-xl font-semibold text-paper">AgriLink</span>
        <p className="font-mono text-[10px] text-gold tracking-widest mt-1">SUPER ADMIN</p>
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
        <p className="font-mono text-[10px] text-paper/30">v2.0 prototype</p>
      </div>
    </aside>
  );
}

function TopBar({ email, onSignOut, tab, onMenuClick }) {
  const titles = { overview: "Overview", mfis: "MFI Applications", kyc: "KYC Review", loans: "Network Loans", repayments: "Network Repayments" };
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

function MfiTable({ mfiQueue, onApprove, onDeny }) {
  return (
    <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-forest/10 text-left text-xs text-sage">
              <th className="w-1"></th>
              <th className="px-5 py-3 font-medium">Institution</th>
              <th className="px-5 py-3 font-medium">Region</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
              <th className="px-5 py-3 font-medium text-right">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {mfiQueue.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sage text-sm">No MFI registrations yet.</td>
              </tr>
            )}
            {mfiQueue.map((m) => (
              <tr key={m.id} className="border-b border-forest/5 hover:bg-forest/[0.02]">
                <td className={`w-1 ${railColor(m.status)}`}></td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink">{m.name}</p>
                  {m.description && <p className="text-xs text-sage max-w-xs truncate">{m.description}</p>}
                </td>
                <td className="px-5 py-3.5 text-ink/70">{m.region}</td>
                <td className="px-5 py-3.5 text-ink/70">
                  <p className="font-mono text-xs">{m.contact_email}</p>
                  <p className="text-xs text-sage">{m.contact_phone}</p>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-sage">{new Date(m.submitted_at).toLocaleDateString()}</td>
                <td className="px-5 py-3.5 text-right"><StatusBadge status={m.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  {m.status === "pending" ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => onApprove(m, "approved")} className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark">
                        Approve
                      </button>
                      <button onClick={() => onDeny(m, "denied")} className="text-xs font-medium px-3 py-1.5 rounded-full border border-forest/20 text-forest/70 hover:bg-forest/5">
                        Deny
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-sage">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Overview({ uniqueFarmers, pendingKyc, activeMfis, pendingMfis, totalDisbursed, kycQueue, loanQueue, setTab }) {
  const avgRiskScore = loanQueue.length > 0 ? Math.round(loanQueue.reduce((sum, l) => sum + computeRiskScore(l).score, 0) / loanQueue.length) : 0;
  const recentActivity = [...kycQueue, ...loanQueue].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 6);
  const growthData = buildGrowthData(kycQueue);
  const volumeData = buildVolumeData(loanQueue);
  const funnelData = buildFunnelData(kycQueue);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatTile label="Active MFIs" value={activeMfis} onClick={() => setTab("mfis")} />
        <StatTile label="Pending MFIs" value={pendingMfis} accent={pendingMfis > 0 ? "gold" : null} onClick={() => setTab("mfis")} />
        <StatTile label="Registered farmers" value={uniqueFarmers} />
        <StatTile label="Pending KYC" value={pendingKyc} accent={pendingKyc > 0 ? "gold" : null} onClick={() => setTab("kyc")} />
        <StatTile label="Total disbursed" value={`${totalDisbursed.toLocaleString()} XAF`} mono />
        <StatTile label="Avg. loan risk score" value={`${avgRiskScore}/100`} mono />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
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
        <ChartCard title="Loan volume by month, across all MFIs">
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
        {recentActivity.length === 0 && <p className="text-sage text-sm px-5 py-6">No activity yet.</p>}
        {recentActivity.map((item, i) => {
          const isKyc = "region" in item;
          return (
            <div key={item.id} className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 ${i !== 0 ? "border-t border-forest/5" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(item.status)}`} />
              <span className="text-sm text-ink/80 flex-1 truncate">
                {isKyc ? "KYC submission" : "Loan application"} for {item.full_name || item.profiles?.full_name || item.profiles?.email}
                {item.mfis?.name && ` (${item.mfis.name})`}
              </span>
              <span className="font-mono text-xs text-sage flex-shrink-0">{new Date(item.submitted_at).toLocaleDateString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({ title, children, span }) {
  return (
    <div className={`bg-white border border-forest/10 rounded-xl p-4 md:p-5 ${span === 2 ? "lg:col-span-2" : ""}`}>
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
    points.push({ date: new Date(k.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), cumulative });
  });
  return points;
}

function buildVolumeData(loanQueue) {
  const disbursed = loanQueue.filter((l) => l.status === "disbursed");
  const byMonth = {};
  disbursed.forEach((l) => {
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

function KycTable({ kycQueue, onApprove, onDeny }) {
  const [reviewing, setReviewing] = useState(null);

  return (
    <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-forest/10 text-left text-xs text-sage">
              <th className="w-1"></th>
              <th className="px-5 py-3 font-medium">Farmer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Age</th>
              <th className="px-5 py-3 font-medium">Region</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
              <th className="px-5 py-3 font-medium text-right">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {kycQueue.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sage text-sm">No KYC submissions yet.</td>
              </tr>
            )}
            {kycQueue.map((k) => (
              <tr key={k.id} className="border-b border-forest/5 hover:bg-forest/[0.02]">
                <td className={`w-1 ${railColor(k.status)}`}></td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink">{k.full_name}</p>
                  <p className="font-mono text-xs text-sage">{k.profiles?.email}</p>
                </td>
                <td className="px-5 py-3.5 text-ink/70">{k.phone || "—"}</td>
                <td className="px-5 py-3.5 text-ink/70">{k.age || "—"}</td>
                <td className="px-5 py-3.5 text-ink/70">{k.region}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-sage">{new Date(k.submitted_at).toLocaleDateString()}</td>
                <td className="px-5 py-3.5 text-right"><StatusBadge status={k.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => setReviewing(k)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-forest text-paper hover:bg-forestdark">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

function LoansMonitor({ loanQueue }) {
  const [viewing, setViewing] = useState(null);

  return (
    <div>
      <p className="text-sm text-sage mb-4">
        Read-only view. Loan decisions belong to each farmer's chosen MFI, this is here so you can monitor activity and documents across the network.
      </p>
      <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-forest/10 text-left text-xs text-sage">
                <th className="w-1"></th>
                <th className="px-5 py-3 font-medium">Farmer</th>
                <th className="px-5 py-3 font-medium">MFI</th>
                <th className="px-5 py-3 font-medium">Purpose</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium text-right">Risk score</th>
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
                <tr key={l.id} className="border-b border-forest/5">
                  <td className={`w-1 ${railColor(l.status)}`}></td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{l.profiles?.full_name || l.profiles?.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink/70">{l.mfis?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-ink/70">{l.purpose}</td>
                  <td className="px-5 py-3.5 text-right font-mono">{Number(l.amount_requested).toLocaleString()} XAF</td>
                  <td className="px-5 py-3.5 text-right"><RiskBadge loan={l} /></td>
                  <td className="px-5 py-3.5 text-right"><StatusBadge status={l.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => setViewing(l)} className="text-xs font-medium px-3 py-1.5 rounded-full border border-forest/20 text-forest hover:bg-forest/5">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && <AdminLoanDetailModal loan={viewing} onClose={() => setViewing(null)} />}
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

function RepaymentsMonitor({ repayments }) {
  const computeStatus = (r) => {
    if (r.status === "paid") return "paid";
    const due = new Date(r.due_date);
    const today = new Date();
    const daysUntil = (due - today) / (1000 * 60 * 60 * 24);
    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 7) return "due";
    return "upcoming";
  };

  return (
    <div>
      <p className="text-sm text-sage mb-4">
        Read-only view. Payments are recorded by each MFI, this is here so you can monitor repayment health across the network.
      </p>
      <div className="bg-white border border-forest/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-forest/10 text-left text-xs text-sage">
                <th className="w-1"></th>
                <th className="px-5 py-3 font-medium">Farmer</th>
                <th className="px-5 py-3 font-medium">MFI</th>
                <th className="px-5 py-3 font-medium">Installment</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium text-right">Amount due</th>
                <th className="px-5 py-3 font-medium text-right">Status</th>
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
                  <tr key={r.id} className="border-b border-forest/5">
                    <td className={`w-1 ${repaymentRailColor(status)}`}></td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{r.loan_applications?.profiles?.full_name || r.loan_applications?.profiles?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink/70">{r.loan_applications?.mfis?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-ink/70">#{r.installment_number}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-sage">{r.due_date}</td>
                    <td className="px-5 py-3.5 text-right font-mono">{Number(r.amount_due).toLocaleString()} XAF</td>
                    <td className="px-5 py-3.5 text-right"><RepaymentStatusBadge status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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