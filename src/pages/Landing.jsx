import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Smartphone, FileSignature } from "lucide-react";
import bgImage from "../assets/images/pic1.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
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
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-2 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium px-4 py-2 rounded-full bg-mint text-forestdark font-semibold hover:brightness-95 transition"
            >
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
              <Link
                to="/signup"
                className="text-sm font-semibold px-6 py-3 rounded-full bg-mint text-forestdark hover:brightness-95 transition"
              >
                Apply for a loan
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium px-6 py-3 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-mono text-xs text-gold tracking-widest mb-2">HOW IT WORKS</p>
        <h2 className="font-display text-3xl font-semibold text-forest mb-10">
          From application to funded, in one place
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FeatureCard
            icon={<ShieldCheck size={20} />}
            title="Verify your identity"
            body="Submit your documents once, reviewed securely by your lending partner."
          />
          <FeatureCard
            icon={<CheckCircle2 size={20} />}
            title="Apply for a loan"
            body="A guided application with GPS farm verification and instant terms."
          />
          <FeatureCard
            icon={<FileSignature size={20} />}
            title="Sign your agreement"
            body="Review and e-sign your loan terms before any funds move."
          />
          <FeatureCard
            icon={<Smartphone size={20} />}
            title="Get paid, repay easily"
            body="Funds and repayments move through your mobile money account."
          />
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-forestdark px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-paper mb-4">
            Ready to get started?
          </h2>
          <p className="text-mint mb-8">Create your account and begin your loan application today.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/signup"
              className="text-sm font-semibold px-6 py-3 rounded-full bg-mint text-forestdark hover:brightness-95 transition"
            >
              Create an account
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium px-6 py-3 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
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