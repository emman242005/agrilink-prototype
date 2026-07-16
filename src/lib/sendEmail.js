import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export async function sendEmail(toEmail, toName, subject, message) {
  if (!toEmail) return;
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: toEmail,
        to_name: toName || "there",
        subject: subject,
        message: message,
      },
      { publicKey: PUBLIC_KEY }
    );
  } catch (err) {
    console.error("EmailJS send failed:", err);
  }
}