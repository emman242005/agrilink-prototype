import { supabase } from "./supabaseClient";

export function logLoginLocation(userId) {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await supabase.from("login_locations").insert({
        user_id: userId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    },
    () => {
      // Permission denied or unavailable — fail silently, login still proceeds normally
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}