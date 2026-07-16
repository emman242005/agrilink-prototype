import pic4Image from "../assets/images/pic4.png";
import { Link } from "react-router-dom";
import {
  CheckCircle2, ShieldCheck, Smartphone, FileSignature,
  MapPin, BarChart2, Lock, Users, Landmark, Wallet,
} from "lucide-react";
import bgImage from "../assets/images/pic1.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 42, 30, 0.55), rgba(15, 42, 30, 0.75)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
          <span className="font-display text-2xl font-semibold text-paper">AgriLink</span>
          <div className="flex gap-2">
            <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition">
              Log in
            </Link>
            <Link to="/signup" className="text-sm font-medium px-4 py-2 rounded-full bg-mint text-forestdark font-semibold hover:brightness-95 transition">
              Sign up
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center px-6">
          <div className="max-w-6xl mx-auto w-full">
            <p className="font-mono text-xs text-gold tracking-widest mb-3">DIGITAL LENDING PLATFORM</p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-paper mb-4 max-w-2xl leading-tight">
              Connecting Cameroon's farmers to credit
            </h1>
            <p className="text-paper/90 text-lg max-w-xl mb-8 leading-relaxed">
              AgriLink helps smallholder farmers get verified, apply for loans, and receive funds through mobile money, while giving microfinance institutions the tools to review, score, and approve with confidence.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/signup" className="text-sm font-semibold px-6 py-3 rounded-full bg-mint text-forestdark hover:brightness-95 transition">
                Apply for a loan
              </Link>
              <Link to="/login" className="text-sm font-medium px-6 py-3 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition">
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-forest px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <TrustItem icon={<MapPin size={16} />} label="GPS-verified farms" />
          <TrustItem icon={<FileSignature size={16} />} label="E-signed agreements" />
          <TrustItem icon={<Wallet size={16} />} label="Mobile money payouts" />
          <TrustItem icon={<Lock size={16} />} label="Full audit trail" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-mono text-xs text-gold tracking-widest mb-2">HOW IT WORKS</p>
        <h2 className="font-display text-3xl font-semibold text-forest mb-10">
          From application to funded, in one place
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FeatureCard icon={<ShieldCheck size={20} />} title="Verify your identity" body="Submit your documents once, reviewed securely by your lending partner." />
          <FeatureCard icon={<CheckCircle2 size={20} />} title="Apply for a loan" body="A guided application with GPS farm verification and instant terms." />
          <FeatureCard icon={<FileSignature size={20} />} title="Sign your agreement" body="Review and e-sign your loan terms before any funds move." />
          <FeatureCard icon={<Smartphone size={20} />} title="Get paid, repay easily" body="Funds and repayments move through your mobile money account." />
        </div>
      </div>

      <div
  className="border-y border-forest/10"
  style={{
    backgroundImage: `linear-gradient(rgba(250, 249, 246, 0.55), rgba(250, 249, 246, 0.45)), url(${pic4Image})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <div className="w-11 h-11 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <p className="font-mono text-xs text-gold tracking-widest mb-2">FOR FARMERS</p>
            <h3 className="font-display text-2xl font-semibold text-forest mb-4">
              A clear path to formal credit
            </h3>
            <ul className="space-y-3">
              <ListItem>Apply from your phone, no branch visit required</ListItem>
              <ListItem>Upload land documents and ID once, reused for every application</ListItem>
              <ListItem>See your exact repayment schedule before you sign anything</ListItem>
              <ListItem>Receive funds directly to your mobile money account</ListItem>
            </ul>
            <Link to="/signup" className="inline-block mt-6 text-sm font-semibold px-6 py-3 rounded-full bg-forest text-paper hover:bg-forestdark transition">
              Apply as a farmer
            </Link>
          </div>

          <div>
            <div className="w-11 h-11 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-4">
              <Landmark size={20} />
            </div>
            <p className="font-mono text-xs text-gold tracking-widest mb-2">FOR MICROFINANCE INSTITUTIONS</p>
            <h3 className="font-display text-2xl font-semibold text-forest mb-4">
              Reach more farmers, with less risk
            </h3>
            <ul className="space-y-3">
              <ListItem>Document-backed KYC with an inline review workspace</ListItem>
              <ListItem>Alternative credit scoring built from land, guarantors, and cooperative data</ListItem>
              <ListItem>Set your own rates and terms at approval</ListItem>
              <ListItem>Track every disbursement and repayment with a mobile money reference</ListItem>
            </ul>
            <a href="mailto:hello@agrilink.app" className="inline-block mt-6 text-sm font-semibold px-6 py-3 rounded-full border border-forest text-forest hover:bg-forest/5 transition">
              Talk to us about a pilot
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-mono text-xs text-gold tracking-widest mb-2">SECURITY & COMPLIANCE</p>
        <h2 className="font-display text-3xl font-semibold text-forest mb-10">
          Built with trust in mind
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SecurityCard icon={<BarChart2 size={20} />} title="Alternative credit scoring" body="Ten weighted factors, land ownership, guarantors, cooperative membership, and more, give lenders a real risk signal without formal credit history." />
          <SecurityCard icon={<FileSignature size={20} />} title="Dual e-signature" body="Every loan is signed by the farmer first, then countersigned by a loan officer before funds are ever released." />
          <SecurityCard icon={<Lock size={20} />} title="Role-based access" body="Farmers only see their own data. Officers see only what they're authorized to review. Every decision is timestamped." />
        </div>
      </div>

      <div className="bg-forestdark px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-paper mb-4">
            Ready to get started?
          </h2>
          <p className="text-mint mb-8">Create your account and begin your loan application today.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/signup" className="text-sm font-semibold px-6 py-3 rounded-full bg-mint text-forestdark hover:brightness-95 transition">
              Create an account
            </Link>
            <Link to="/login" className="text-sm font-medium px-6 py-3 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition">
              Log in
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-forestdark border-t border-paper/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg font-semibold text-paper">AgriLink</span>
          <p className="font-mono text-[11px] text-sage tracking-wide text-center">
            AGRILINK · CONNECTING FARMERS TO CREDIT
          </p>
        </div>
      </footer>
    </div>
  );
}

function TrustItem({ icon, label }) {
  return (
    <span className="flex items-center gap-2 text-sm text-paper/90">
      <span className="text-gold">{icon}</span>
      {label}
    </span>
  );
}

function FeatureCard({ icon, title, body }) {
  return (
    <div className="bg-white border border-forest/10 rounded-2xl p-6">
      <div className="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-forest mb-2">{title}</h3>
      <p className="text-sm text-sage leading-relaxed">{body}</p>
    </div>
  );
}

function ListItem({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-ink/80">
      <CheckCircle2 size={16} className="text-forest mt-0.5 flex-shrink-0" />
      {children}
    </li>
  );
}

function SecurityCard({ icon, title, body }) {
  return (
    <div className="bg-forest/5 rounded-2xl p-6">
      <div className="w-10 h-10 rounded-full bg-forest text-paper flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-forest mb-2">{title}</h3>
      <p className="text-sm text-sage leading-relaxed">{body}</p>
    </div>
  );
}