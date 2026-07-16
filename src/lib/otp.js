import { supabase } from "./supabaseClient";
import { sendEmail } from "./sendEmail";

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOtp(userId, email, name) {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await supabase.from("login_otps").insert({ user_id: userId, code, expires_at: expiresAt });
  await sendEmail(
    email,
    name,
    "Your AgriLink verification code",
    `Your AgriLink login verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.`
  );
}

export async function verifyOtp(userId, enteredCode) {
  const { data, error } = await supabase
    .from("login_otps")
    .select("*")
    .eq("user_id", userId)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { success: false, message: "No verification code found. Please request a new one." };
  }
  if (new Date(data.expires_at) < new Date()) {
    return { success: false, message: "This code has expired. Please request a new one." };
  }
  if (data.code !== enteredCode.trim()) {
    return { success: false, message: "Incorrect code. Please try again." };
  }

  await supabase.from("login_otps").update({ consumed: true }).eq("id", data.id);
  sessionStorage.setItem(`agrilink_otp_verified_${userId}`, "true");
  return { success: true };
}

export function isOtpVerified(userId) {
  return sessionStorage.getItem(`agrilink_otp_verified_${userId}`) === "true";
}