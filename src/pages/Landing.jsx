import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2, ShieldCheck, Smartphone, FileSignature,
  MapPin, BarChart2, Lock, Users, Landmark, Wallet,
} from "lucide-react";
import bgImage from "../assets/images/pic1.png";
import pic4Image from "../assets/images/pic4.png";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Landing() {
  const { t } = useTranslation();

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
        <header className="px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between max-w-6xl mx-auto w-full gap-2">
          <span className="font-display text-lg sm:text-2xl font-semibold text-paper flex-shrink-0">AgriLink</span>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <LanguageSwitcher variant="dark" />
            <Link to="/mfi/signup" className="hidden sm:inline-block text-sm font-medium px-4 py-2 rounded-full border border-gold/50 text-gold hover:bg-gold/10 transition whitespace-nowrap">
              {t("nav_register_mfi")}
            </Link>
            <Link to="/login" className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition whitespace-nowrap">
              {t("nav_login")}
            </Link>
            <Link to="/signup" className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-mint text-forestdark font-semibold hover:brightness-95 transition whitespace-nowrap">
              {t("nav_signup")}
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center px-6">
          <div className="max-w-6xl mx-auto w-full">
            <p className="font-mono text-xs text-gold tracking-widest mb-3 uppercase">{t("hero_kicker")}</p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-paper mb-4 max-w-2xl leading-tight">
              {t("hero_title")}
            </h1>
            <p className="text-paper/90 text-lg max-w-xl mb-8 leading-relaxed">
              {t("hero_body")}
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/signup" className="text-sm font-semibold px-6 py-3 rounded-full bg-mint text-forestdark hover:brightness-95 transition">
                {t("hero_apply")}
              </Link>
              <Link to="/mfi/signup" className="text-sm font-semibold px-6 py-3 rounded-full bg-gold text-forestdark hover:brightness-95 transition">
                {t("hero_register_mfi")}
              </Link>
              <Link to="/login" className="text-sm font-medium px-6 py-3 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition">
                {t("hero_have_account")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-forest px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <TrustItem icon={<MapPin size={16} />} label={t("trust_gps")} />
          <TrustItem icon={<FileSignature size={16} />} label={t("trust_esign")} />
          <TrustItem icon={<Wallet size={16} />} label={t("trust_momo")} />
          <TrustItem icon={<Lock size={16} />} label={t("trust_audit")} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-mono text-xs text-gold tracking-widest mb-2 uppercase">{t("how_kicker")}</p>
        <h2 className="font-display text-3xl font-semibold text-forest mb-10">
          {t("how_title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FeatureCard icon={<ShieldCheck size={20} />} title={t("how_1_title")} body={t("how_1_body")} />
          <FeatureCard icon={<CheckCircle2 size={20} />} title={t("how_2_title")} body={t("how_2_body")} />
          <FeatureCard icon={<FileSignature size={20} />} title={t("how_3_title")} body={t("how_3_body")} />
          <FeatureCard icon={<Smartphone size={20} />} title={t("how_4_title")} body={t("how_4_body")} />
        </div>
      </div>

      <div
        className="border-y border-forest/10"
        style={{
          backgroundImage: `linear-gradient(rgba(250, 249, 246, 0.93), rgba(250, 249, 246, 0.93)), url(${pic4Image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <div className="w-11 h-11 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <p className="font-mono text-xs text-gold tracking-widest mb-2 uppercase">{t("farmers_kicker")}</p>
            <h3 className="font-display text-2xl font-semibold text-forest mb-4">
              {t("farmers_title")}
            </h3>
            <ul className="space-y-3">
              <ListItem>{t("farmers_1")}</ListItem>
              <ListItem>{t("farmers_2")}</ListItem>
              <ListItem>{t("farmers_3")}</ListItem>
              <ListItem>{t("farmers_4")}</ListItem>
            </ul>
            <Link to="/signup" className="inline-block mt-6 text-sm font-semibold px-6 py-3 rounded-full bg-forest text-paper hover:bg-forestdark transition">
              {t("farmers_cta")}
            </Link>
          </div>

          <div>
            <div className="w-11 h-11 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-4">
              <Landmark size={20} />
            </div>
            <p className="font-mono text-xs text-gold tracking-widest mb-2 uppercase">{t("mfis_kicker")}</p>
            <h3 className="font-display text-2xl font-semibold text-forest mb-4">
              {t("mfis_title")}
            </h3>
            <ul className="space-y-3">
              <ListItem>{t("mfis_1")}</ListItem>
              <ListItem>{t("mfis_2")}</ListItem>
              <ListItem>{t("mfis_3")}</ListItem>
              <ListItem>{t("mfis_4")}</ListItem>
            </ul>
            <Link to="/mfi/signup" className="inline-block mt-6 text-sm font-semibold px-6 py-3 rounded-full border border-forest text-forest hover:bg-forest/5 transition">
              {t("mfis_cta")}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-mono text-xs text-gold tracking-widest mb-2 uppercase">{t("security_kicker")}</p>
        <h2 className="font-display text-3xl font-semibold text-forest mb-10">
          {t("security_title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SecurityCard icon={<BarChart2 size={20} />} title={t("security_1_title")} body={t("security_1_body")} />
          <SecurityCard icon={<FileSignature size={20} />} title={t("security_2_title")} body={t("security_2_body")} />
          <SecurityCard icon={<Lock size={20} />} title={t("security_3_title")} body={t("security_3_body")} />
        </div>
      </div>

      <div className="bg-forestdark px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-paper mb-4">
            {t("final_title")}
          </h2>
          <p className="text-mint mb-8">{t("final_body")}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/signup" className="text-sm font-semibold px-6 py-3 rounded-full bg-mint text-forestdark hover:brightness-95 transition">
              {t("final_farmer")}
            </Link>
            <Link to="/mfi/signup" className="text-sm font-semibold px-6 py-3 rounded-full bg-gold text-forestdark hover:brightness-95 transition">
              {t("final_mfi")}
            </Link>
            <Link to="/login" className="text-sm font-medium px-6 py-3 rounded-full border border-paper/30 text-paper hover:bg-paper/10 transition">
              {t("final_login")}
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-forestdark border-t border-paper/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg font-semibold text-paper">AgriLink</span>
          <p className="font-mono text-[11px] text-sage tracking-wide text-center">
            {t("footer_tag")}
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