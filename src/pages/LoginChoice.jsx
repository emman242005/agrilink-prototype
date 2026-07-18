import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Landmark } from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginChoice() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-forestdark flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-6">
          <LanguageSwitcher variant="dark" />
        </div>
        <div className="text-center mb-10">
          <span className="font-display text-2xl font-semibold text-paper">AgriLink</span>
          <h1 className="font-display text-xl font-semibold text-paper mt-4">{t("choice_login_title")}</h1>
          <p className="text-sm text-paper/70 mt-1">{t("choice_login_sub")}</p>
        </div>

        <div className="space-y-4">
          <Link to="/login/farmer" className="flex items-center gap-4 bg-paper rounded-2xl p-5 hover:bg-paper/95 transition group">
            <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
              <User size={22} />
            </div>
            <div>
              <p className="font-display font-semibold text-forest">{t("choice_farmer_title")}</p>
              <p className="text-sm text-sage">{t("choice_farmer_login_sub")}</p>
            </div>
          </Link>

          <Link to="/mfi/login" className="flex items-center gap-4 bg-paper rounded-2xl p-5 hover:bg-paper/95 transition group">
            <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
              <Landmark size={22} />
            </div>
            <div>
              <p className="font-display font-semibold text-forest">{t("choice_mfi_title")}</p>
              <p className="text-sm text-sage">{t("choice_mfi_login_sub")}</p>
            </div>
          </Link>
        </div>

        <p className="text-center text-sm text-paper/60 mt-8">
          <Link to="/" className="underline underline-offset-4">{t("choice_back_home")}</Link>
        </p>
      </div>
    </div>
  );
}