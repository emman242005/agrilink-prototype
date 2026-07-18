import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Search, Landmark } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function MfiPickerModal({ onClose, onSelect }) {
  const { t } = useTranslation();
  const [mfis, setMfis] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("mfis")
        .select("id, name, region, description")
        .eq("status", "approved")
        .order("name", { ascending: true });
      setMfis(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = mfis.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest">{t("mfi_picker_title")}</h2>
          <button onClick={onClose} className="text-sage hover:text-forest px-2">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("mfi_picker_search")}
              className="w-full border border-forest/20 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-forest"
            />
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {loading && <p className="text-sm text-sage">{t("mfi_picker_loading")}</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-sage">{t("mfi_picker_none")}</p>
          )}
          {filtered.map((mfi) => (
            <button
              key={mfi.id}
              onClick={() => onSelect(mfi)}
              className="w-full flex items-start gap-3 border border-forest/15 rounded-xl p-4 text-left hover:border-forest/40 hover:bg-forest/[0.02] transition"
            >
              <div className="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
                <Landmark size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-forest">{mfi.name}</p>
                <p className="text-xs text-sage mb-1">{mfi.region}</p>
                {mfi.description && <p className="text-xs text-ink/60 line-clamp-2">{mfi.description}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}