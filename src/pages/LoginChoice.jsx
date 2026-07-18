import { Link } from "react-router-dom";
import { User, Landmark } from "lucide-react";

export default function LoginChoice() {
  return (
    <div className="min-h-screen bg-forestdark flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <span className="font-display text-2xl font-semibold text-paper">AgriLink</span>
          <h1 className="font-display text-xl font-semibold text-paper mt-4">Log in</h1>
          <p className="text-sm text-paper/70 mt-1">Choose how you'd like to continue</p>
        </div>

        <div className="space-y-4">
          <Link
            to="/login/farmer"
            className="flex items-center gap-4 bg-paper rounded-2xl p-5 hover:bg-paper/95 transition group"
          >
            <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
              <User size={22} />
            </div>
            <div>
              <p className="font-display font-semibold text-forest">I'm a farmer</p>
              <p className="text-sm text-sage">Log in to apply for or manage a loan</p>
            </div>
          </Link>

          <Link
            to="/mfi/login"
            className="flex items-center gap-4 bg-paper rounded-2xl p-5 hover:bg-paper/95 transition group"
          >
            <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
              <Landmark size={22} />
            </div>
            <div>
              <p className="font-display font-semibold text-forest">I'm an MFI</p>
              <p className="text-sm text-sage">Log in to your lending dashboard</p>
            </div>
          </Link>
        </div>

        <p className="text-center text-sm text-paper/60 mt-8">
          <Link to="/" className="underline underline-offset-4">Back to home</Link>
        </p>
      </div>
    </div>
  );
}