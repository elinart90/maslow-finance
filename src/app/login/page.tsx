"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Triangle } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!email) return;
    setLoading(true);
    await signIn(email);
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <Triangle className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Maslow Finance</div>
            <div className="text-xs text-gray-400">Life savings system</div>
          </div>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="text-2xl mb-2">📬</div>
            <div className="font-semibold text-gray-900 mb-1">Check your email</div>
            <p className="text-sm text-gray-500">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h1>
            <p className="text-sm text-gray-400 mb-6">No password needed — we'll email you a link.</p>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email address</label>
            <input
              type="email"
              className="input mb-4"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle()}
            />
            <button
              className="btn-primary w-full justify-center"
              onClick={handle}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}