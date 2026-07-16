import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function LoginHistoryModal({ userId, farmerName, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("login_locations")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(20);
      setHistory(data || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest/10 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-gold tracking-widest mb-1">LOGIN HISTORY</p>
            <h2 className="font-display text-lg font-semibold text-forest">{farmerName}</h2>
          </div>
          <button onClick={onClose} className="text-sage hover:text-forest px-2">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4">
          {loading && <p className="text-sm text-sage">Loading...</p>}
          {!loading && history.length === 0 && (
            <p className="text-sm text-sage">No login locations recorded yet.</p>
          )}
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between border-b border-forest/5 py-2 last:border-0">
                <div>
                  <p className="text-sm text-ink/80">{new Date(h.logged_at).toLocaleString()}</p>
                  {h.latitude ? (
                    <p className="font-mono text-xs text-sage">
                      {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-xs text-sage">No location captured</p>
                  )}
                </div>
                {h.latitude && (
                  
                    href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-forest hover:underline"
                  >
                    <MapPin size={13} /> View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
