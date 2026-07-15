import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data || []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    load();
  };

  const toggle = () => {
    setOpen(!open);
    if (!open) markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative p-2 text-sage hover:text-forest">
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-gold text-forestdark text-[10px] font-mono font-semibold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-forest/10 rounded-xl shadow-lg overflow-hidden z-10">
          <div className="px-4 py-3 border-b border-forest/10">
            <p className="text-sm font-medium text-forest">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-sm text-sage px-4 py-6 text-center">No notifications yet.</p>
            )}
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className={`px-4 py-3 text-sm ${i !== 0 ? "border-t border-forest/5" : ""} ${!n.read ? "bg-gold/5" : ""}`}
              >
                <p className="text-ink/80">{n.message}</p>
                <p className="text-xs text-sage font-mono mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}