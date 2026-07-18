import { useTranslation } from "react-i18next";

export default function LanguageSwitcher({ variant = "light" }) {
  const { i18n } = useTranslation();

  const setLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("agrilink_lang", lang);
  };

  const isDark = variant === "dark";

  return (
    <div className={`flex items-center rounded-full border text-xs font-medium overflow-hidden ${isDark ? "border-paper/30" : "border-forest/20"}`}>
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 transition ${
          i18n.language === "en"
            ? isDark ? "bg-paper/20 text-paper" : "bg-forest text-paper"
            : isDark ? "text-paper/60 hover:text-paper" : "text-forest/50 hover:text-forest"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("fr")}
        className={`px-2.5 py-1 transition ${
          i18n.language === "fr"
            ? isDark ? "bg-paper/20 text-paper" : "bg-forest text-paper"
            : isDark ? "text-paper/60 hover:text-paper" : "text-forest/50 hover:text-forest"
        }`}
      >
        FR
      </button>
    </div>
  );
}