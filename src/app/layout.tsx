"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import { Triangle, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";

type AuthScreen = "login" | "signup";

// ─── Helper: is onboarding complete? ─────────────────────────────────────────
// Requires name, age > 0, and monthlyIncome > 0.
// Income is intentionally flexible — users can update it anytime in Settings.
function isOnboarded(profile: { name: string; age: number; monthlyIncome: number }) {
  return (
    profile.name.trim().length > 0 &&
    profile.age > 0 &&
    profile.monthlyIncome > 0
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F9F7] gap-4">
      <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
        <Triangle className="w-5 h-5 text-white fill-white" />
      </div>
      <div className="flex gap-1.5">
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">Loading your financial data…</p>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-3 justify-center mb-8">
      <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
        <Triangle className="w-5 h-5 text-white fill-white" />
      </div>
      <div>
        <div className="font-semibold text-gray-900 text-lg leading-none">Maslow Finance</div>
        <div className="text-xs text-gray-400 mt-0.5">Life savings system</div>
      </div>
    </div>
  );
}

// ─── Tier Bar ─────────────────────────────────────────────────────────────────
function TierBar() {
  return (
    <div className="mt-6">
      <div className="flex gap-1.5 justify-center">
        {[
          { color: "#DC2626", label: "Survive" },
          { color: "#EA580C", label: "Secure" },
          { color: "#D97706", label: "Family" },
          { color: "#16A34A", label: "Wealth" },
          { color: "#2563EB", label: "Legacy" },
        ].map(({ color, label }) => (
          <div key={label} className="flex-1 text-center">
            <div className="h-1.5 rounded-full mb-1" style={{ backgroundColor: color }} />
            <div className="text-[9px] text-gray-300">{label}</div>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-gray-300 mt-1.5">
        Built on Maslow's Hierarchy of Needs
      </p>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onSwitch }: { onSwitch: (s: AuthScreen) => void }) {
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handle() {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn(email);
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Failed to send link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] px-4">
        <div className="w-full max-w-sm">
          <Logo />
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 text-2xl">✉</div>
            <h2 className="font-semibold text-gray-900 text-lg mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              We sent a magic link to <strong className="text-gray-700">{email}</strong>.
              Click it to sign in — no password needed.
            </p>
            <button
              className="mt-6 text-xs text-gray-400 underline hover:text-gray-600"
              onClick={() => { setSent(false); setEmail(""); }}
            >
              Use a different email
            </button>
          </div>
          <TierBar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] px-4">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-6">Sign in to your account to continue.</p>

          <label className="label">Email address</label>
          <input
            type="email"
            className="input mb-1"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mb-2 mt-1">{error}</p>}

          <button
            className="btn-primary w-full justify-center mt-4"
            onClick={handle}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Sending…" : "Send magic link →"}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">new here?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button className="btn-secondary w-full justify-center" onClick={() => onSwitch("signup")}>
            Create an account
          </button>
        </div>
        <TierBar />
        <p className="text-center text-xs text-gray-400 mt-4">
          Your data is private and encrypted. Only you can access it.
        </p>
      </div>
    </div>
  );
}

// ─── Sign Up Page ─────────────────────────────────────────────────────────────
function SignupPage({ onSwitch }: { onSwitch: (s: AuthScreen) => void }) {
  const { signIn } = useStore();
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setError("");
    };
  }

  async function handle() {
    if (!form.name.trim()) { setError("Please enter your name."); return; }
    if (!form.email || !form.email.includes("@")) { setError("Please enter a valid email address."); return; }
    setError("");
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("maslow_pending_name", form.name.trim());
      }
      await signIn(form.email);
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] px-4">
        <div className="w-full max-w-sm">
          <Logo />
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 text-2xl">✉</div>
            <h2 className="font-semibold text-gray-900 text-lg mb-2">Verify your email</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-2">
              We sent a confirmation link to <strong className="text-gray-700">{form.email}</strong>.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Click the link to activate your account. You will then complete your financial profile.
            </p>
            <button
              className="mt-6 text-xs text-gray-400 underline hover:text-gray-600"
              onClick={() => setSent(false)}
            >
              Back to sign up
            </button>
          </div>
          <TierBar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] px-4">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <button
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 -mt-1"
            onClick={() => onSwitch("login")}
          >
            <ArrowLeft className="w-3 h-3" /> Back to sign in
          </button>

          <h1 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-400 mb-5">Start your Maslow financial journey today.</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
            {[
              "Track expenses across all 5 Maslow tiers",
              "Set and monitor savings goals",
              "Debt avalanche elimination tracker",
              "Weekly & annual financial cadence system",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Your full name</label>
              <input type="text" className="input" placeholder="e.g. Elinart Asante"
                value={form.name} onChange={field("name")} autoFocus />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={field("email")}
                onKeyDown={(e) => e.key === "Enter" && handle()} />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <button
            className="btn-primary w-full justify-center mt-5"
            onClick={handle}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-4">
            We'll email you a verification link. No password required.
          </p>
        </div>

        <TierBar />
        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{" "}
          <button className="underline hover:text-gray-600" onClick={() => onSwitch("login")}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
// Shown whenever profile.name, profile.age, or profile.monthlyIncome is missing.
// Income is intentionally re-editable — users can change it anytime in Settings.
function OnboardingPage({ isUpdate = false }: { isUpdate?: boolean }) {
  const { updateProfile, profile } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:
      profile.name ||
      (typeof window !== "undefined"
        ? localStorage.getItem("maslow_pending_name") || ""
        : ""),
    monthlyIncome: profile.monthlyIncome > 0 ? String(profile.monthlyIncome) : "",
    age: profile.age > 0 ? String(profile.age) : "",
    dependants: String(profile.dependants ?? 0),
  });

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function finish() {
    setLoading(true);
    await updateProfile({
      name: form.name.trim(),
      monthlyIncome: Number(form.monthlyIncome),
      age: Number(form.age),
      dependants: Number(form.dependants),
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("maslow_pending_name");
    }
    setLoading(false);
    window.location.href = "/";
  }

  const TIERS = [
    { n: 1, color: "#DC2626", label: "Physiological", sub: "Survival budget — essentials first" },
    { n: 2, color: "#EA580C", label: "Safety", sub: "Emergency fund & insurance" },
    { n: 3, color: "#D97706", label: "Love & Belonging", sub: "Family & shared goals" },
    { n: 4, color: "#16A34A", label: "Esteem", sub: "Wealth building & investment" },
    { n: 5, color: "#2563EB", label: "Self-Actualization", sub: "Legacy & FIRE target" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] px-4 py-10">
      <div className="w-full max-w-lg">
        <Logo />

        {isUpdate && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 text-center">
            Some profile details are missing. Please complete your profile to continue.
          </div>
        )}

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  s === step ? "bg-gray-900 text-white"
                  : s < step ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-400"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 3 && (
                <div className={`w-10 h-px ${s < step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">

          {/* Step 1 — Name & Age */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {isUpdate ? "Update your profile" : `Welcome${form.name ? `, ${form.name.split(" ")[0]}` : ""}! 👋`}
              </h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {isUpdate
                  ? "Your name or age is missing. Please fill these in to continue."
                  : "Let's set up your financial profile. This takes 2 minutes and helps the system detect your current Maslow tier automatically."}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="label">Your full name</label>
                  <input
                    type="text" className="input" placeholder="e.g. Elinart Asante"
                    value={form.name} onChange={field("name")} autoFocus
                  />
                </div>
                <div>
                  <label className="label">Your age</label>
                  <input
                    type="number" className="input" placeholder="e.g. 24"
                    min="18" max="80" value={form.age} onChange={field("age")}
                  />
                </div>
              </div>
              <button
                className="btn-primary w-full justify-center mt-6"
                onClick={() => setStep(2)}
                disabled={!form.name.trim() || !form.age}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Income & Dependants */}
          {step === 2 && (
            <div>
              <button
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Your financial situation</h2>
              <p className="text-sm text-gray-400 mb-2 leading-relaxed">
                Be honest — only you can see this. Your income can be updated anytime in Settings
                as your earnings change.
              </p>
              {/* Income is flexible note */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl mb-5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Your monthly income can be updated anytime from Settings → Your profile.
                  The system recalculates your tier allocation automatically whenever you change it.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Current monthly income (GH₵)</label>
                  <input
                    type="number" className="input" placeholder="e.g. 5000"
                    min="0" value={form.monthlyIncome} onChange={field("monthlyIncome")} autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Include salary plus any regular side income.
                  </p>
                </div>
                <div>
                  <label className="label">Number of dependants</label>
                  <select className="input" value={form.dependants} onChange={field("dependants")}>
                    <option value="0">None — only myself</option>
                    <option value="1">1 (spouse, child, or parent)</option>
                    <option value="2">2</option>
                    <option value="3">3 or more</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Anyone whose expenses you regularly contribute to.
                  </p>
                </div>
              </div>
              <button
                className="btn-primary w-full justify-center mt-6"
                onClick={() => setStep(3)}
                disabled={!form.monthlyIncome || Number(form.monthlyIncome) <= 0}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 3 — Maslow overview + confirm */}
          {step === 3 && (
            <div>
              <button
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Your 5-tier financial system</h2>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                Work through tiers in order — never skip levels.
              </p>
              <div className="space-y-2 mb-6">
                {TIERS.map((t) => (
                  <div
                    key={t.n}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: t.color + "14" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.n}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: t.color }}>{t.label}</div>
                      <div className="text-xs text-gray-400">{t.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your profile</p>
                {[
                  ["Name", form.name],
                  ["Age", form.age],
                  ["Monthly income", `GH₵ ${Number(form.monthlyIncome).toLocaleString()}`],
                  ["Dependants", form.dependants === "0" ? "None" : form.dependants],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-700">{value}</span>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary w-full justify-center"
                onClick={finish}
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Setting up your account…" : "Enter Maslow Finance →"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Income and all other details can be updated anytime in Settings.
        </p>
      </div>
    </div>
  );
}

// ─── Auth Wrapper ─────────────────────────────────────────────────────────────
function AuthWrapper() {
  const [screen, setScreen] = useState<AuthScreen>("login");
  if (screen === "signup") return <SignupPage onSwitch={setScreen} />;
  return <LoginPage onSwitch={setScreen} />;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { initAuth, isAuthenticated, isLoading, profile } = useStore();

  useEffect(() => {
    initAuth();
  }, []);

  // Still resolving session
  if (isLoading) {
    return (
      <html lang="en">
        <body><LoadingScreen /></body>
      </html>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <html lang="en">
        <body><AuthWrapper /></body>
      </html>
    );
  }

  // ── Onboarding gate ───────────────────────────────────────────────────────
  // All three fields must be present. Income is checked > 0 separately
  // because 0 income is not a valid starting point for the tier system.
  // Users who update their income (e.g. got a raise) do so in Settings,
  // never by being forced back through onboarding again.
  // ─────────────────────────────────────────────────────────────────────────
  if (!isOnboarded(profile)) {
    // isUpdate=true shows an amber notice if some fields are already set
    const isPartial = profile.name.length > 0 || profile.age > 0 || profile.monthlyIncome > 0;
    return (
      <html lang="en">
        <body><OnboardingPage isUpdate={isPartial} /></body>
      </html>
    );
  }

  // Fully authenticated and onboarded
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-[#F9F9F7]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}