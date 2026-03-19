"use client";
import { useState, useMemo } from "react";
import { CheckCircle2, Circle, TrendingUp, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { detectCurrentTier, sumTransactions, getExpensesForMonth, getCurrentMonthKey, calcFireNumber, fmt } from "@/lib/utils";
import { TIER_CONFIG } from "@/lib/constants";
import { PageHeader, TierBadge, MetricCard, ProgressRing, SectionCard } from "@/components/ui";

const TIER_THEORY: Record<number, { quote: string; why: string; instruments: string[] }> = {
  1: {
    quote: "You cannot think about safety, love, or self-worth when survival is threatened.",
    why: "Maslow's insight: cortisol floods the system when basic needs are threatened. Financial survival mode blocks long-term thinking entirely. Master the basics first.",
    instruments: ["MTN MoMo savings wallet", "Access/Cal Bank basic savings", "Physical envelope system", "Free budgeting notebook or spreadsheet"],
  },
  2: {
    quote: "An emergency fund does not just cover costs — it buys cognitive freedom.",
    why: "Safety needs, once unmet, generate constant background anxiety. A funded emergency account removes financial fear from your mental foreground so wealth-building thoughts can surface.",
    instruments: ["Bank of Ghana 91-day Treasury Bills", "182-day T-Bills (better yield)", "MTN MoMo locked savings feature", "Enterprise Life / SIC Life insurance", "NHIS premium via MoMo"],
  },
  3: {
    quote: "In Ghana, family financial obligations are real and sacred — budget for them honestly.",
    why: "Maslow: humans are relational beings. Financial isolation is a liability, not a virtue. Budgeting family obligations removes their power to derail your savings.",
    instruments: ["Joint account at GCB or Ecobank", "Databank mutual funds for education savings", "CalBank education savings plan", "Funeral bonds (select insurance companies)"],
  },
  4: {
    quote: "Compound interest begins working for you — or against you — the moment you start.",
    why: "Esteem needs are met through real achievement. In finance, that means growing net worth, building income streams, and achieving the dignity of financial strength. The earlier you start, the more time does the work.",
    instruments: ["Ghana Stock Exchange via IC Securities / Databank / HFC", "Databank Money Market Fund", "Epack Investment Fund", "GSE-listed equities", "Rental income as passive stream"],
  },
  5: {
    quote: "At this tier, wealth is not the goal — it is the vehicle.",
    why: "Self-actualization: becoming the most you can be. Financially, this means enough that money is no longer the constraint. You shift from accumulation to deployment: legacy, impact, freedom.",
    instruments: ["Long-term equity portfolio via IC Securities", "International index funds via Absa Wealth", "Ghana real estate (land, rental)", "Whole-life policy as estate tool", "Legal will via licensed Ghanaian attorney"],
  },
};

export default function TiersPage() {
  const { tierMilestones, toggleMilestone, profile, transactions, debts, savingsGoals } = useStore();

  const [selectedTier, setSelectedTier] = useState<number>(1);

  const monthKey = getCurrentMonthKey();
  const monthExpenses = useMemo(() => sumTransactions(getExpensesForMonth(transactions, monthKey)), [transactions, monthKey]);
  const totalDebt = useMemo(() => debts.reduce((s, d) => s + d.currentBalance, 0), [debts]);
  const totalSaved = useMemo(() => savingsGoals.reduce((s, g) => s + g.current, 0), [savingsGoals]);
  const currentTier = detectCurrentTier(profile.monthlyIncome, monthExpenses, totalSaved, totalDebt);
  const fireNumber = calcFireNumber(profile.monthlyIncome * 0.5);

  const tierProgress = useMemo(
    () =>
      ([1, 2, 3, 4, 5] as const).map((t) => {
        const milestones = tierMilestones.filter((m) => m.tier === t);
        const done = milestones.filter((m) => m.completed).length;
        return { tier: t, total: milestones.length, done, pct: milestones.length > 0 ? (done / milestones.length) * 100 : 0 };
      }),
    [tierMilestones]
  );

  const selectedMilestones = tierMilestones.filter((m) => m.tier === selectedTier);
  const tc = TIER_CONFIG[selectedTier as keyof typeof TIER_CONFIG];
  const theory = TIER_THEORY[selectedTier];
  const prog = tierProgress.find((p) => p.tier === selectedTier)!;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tier Progress"
        subtitle="Your journey through Maslow's financial hierarchy"
      />

      {/* Overall progress row */}
      <div className="card">
        <div className="section-title mb-4">Your 5-tier journey</div>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {([1, 2, 3, 4, 5] as const).map((t) => {
            const p = tierProgress.find((x) => x.tier === t)!;
            const tconf = TIER_CONFIG[t];
            const isActive = t === currentTier;
            const isDone = p.pct === 100;
            const isLocked = t > currentTier + 1;

            return (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`flex-1 min-w-[100px] flex flex-col items-center gap-2 p-3 rounded-xl transition-all border ${
                  selectedTier === t ? "border-gray-900 bg-gray-50" : "border-transparent hover:bg-gray-50"
                }`}
              >
                <ProgressRing pct={p.pct} size={52} stroke={5} color={isDone ? "#16A34A" : tconf.color}>
                  {isLocked ? (
                    <Lock className="w-3 h-3 text-gray-300" />
                  ) : (
                    <span className="text-xs font-bold" style={{ color: isDone ? "#16A34A" : tconf.color }}>{t}</span>
                  )}
                </ProgressRing>
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-700">{tconf.short}</div>
                  <div className="text-[10px] text-gray-400">{p.done}/{p.total}</div>
                </div>
                {isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-900 text-white">Current</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected tier detail */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Milestones */}
        <div className="md:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tc.color }} />
              <h2 className="font-semibold text-gray-900">Tier {selectedTier}: {tc.name}</h2>
              <TierBadge tier={selectedTier} size="sm" label={`${prog.done}/${prog.total} done`} />
            </div>
          </div>

          <div className="h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${prog.pct}%`, backgroundColor: tc.color }}
            />
          </div>

          <div className="space-y-2">
            {selectedMilestones.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMilestone(m.id)}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
              >
                {m.completed ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: tc.color }} />
                ) : (
                  <Circle className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-200 group-hover:text-gray-300" />
                )}
                <span className={`text-sm leading-relaxed ${m.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                  {m.text}
                </span>
                {m.completed && m.completedDate && (
                  <span className="text-[10px] text-gray-300 flex-shrink-0 ml-auto">
                    {new Date(m.completedDate).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Theory sidebar */}
        <div className="space-y-4">
          <div className="card">
            <div className="section-title">Why this tier matters</div>
            <blockquote
              className="text-sm italic leading-relaxed mb-3 pl-3"
              style={{ borderLeft: `3px solid ${tc.color}`, color: tc.dark }}
            >
              "{theory.quote}"
            </blockquote>
            <p className="text-xs text-gray-500 leading-relaxed">{theory.why}</p>
          </div>

          <div className="card">
            <div className="section-title">Ghana instruments</div>
            <div className="space-y-2">
              {theory.instruments.map((ins, i) => (
                <div
                  key={i}
                  className="text-xs p-2.5 rounded-lg leading-relaxed"
                  style={{ backgroundColor: tc.light, color: tc.dark, borderLeft: `2px solid ${tc.color}` }}
                >
                  {ins}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title">Allocation target</div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold" style={{ color: tc.color }}>{tc.pct}%</div>
              <div>
                <div className="text-sm text-gray-600">of monthly income</div>
                <div className="text-xs text-gray-400">
                  = {fmt(profile.monthlyIncome * tc.pct / 100)} / month
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIRE number section */}
      <SectionCard title="Your financial independence target">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Monthly income" value={fmt(profile.monthlyIncome)} />
          <MetricCard label="FIRE number (25×)" value={fmt(fireNumber)} sub="Annual expenses × 25" />
          <MetricCard label="Total debt" value={fmt(totalDebt)} accent={totalDebt > 0 ? "#DC2626" : "#16A34A"} />
          <MetricCard label="Total saved" value={fmt(totalSaved)} accent="#2563EB" />
        </div>
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          The FIRE number is the portfolio size at which your investments generate enough passive income to cover all expenses
          indefinitely (4% withdrawal rate). At your current income, this is estimated at {fmt(fireNumber)}.
          Adjust as your expenses change.
        </p>
      </SectionCard>
    </div>
  );
}
