import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import bgImage from "../assets/images/pic2.png";

export default function Pending() {
  const { session, signOut } = useAuth();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 42, 30, 0.6), rgba(15, 42, 30, 0.75)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute top-6 right-6">
        <NotificationBell userId={session.user.id} />
      </div>

      <div className="max-w-sm text-center bg-paper rounded-2xl p-8 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-full bg-gold/15 flex items-center justify-center mb-5">
          <span className="text-gold text-2xl">⏳</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-forest mb-2">
          Verification in progress
        </h1>
        <p className="text-sage mb-6">
          Your details have been submitted to our lending partners. This usually takes 1–2 business days.
          You'll get access to your dashboard as soon as you're verified.
        </p>
        <button
          onClick={signOut}
          className="text-sm font-medium text-forest underline underline-offset-4"
        >
          Log out
        </button>
      </div>
    </div>
  );
}