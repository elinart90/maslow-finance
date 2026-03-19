"use client";
import { useState } from "react";
import { Plus, Target, Trash2, Edit2, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmt, calcMonthsToGoal, generateId } from "@/lib/utils";
import { TIER_CONFIG } from "@/lib/constants";
import {
  PageHeader, Modal, EmptyState, TierBadge, MetricCard, ProgressRing, SectionCard,
} from "@/components/ui";
import type { SavingsGoal } from "@/lib/types";

const GOAL_COLORS = [
  "#EA580C", "#D97706", "#16A34A", "#2563EB", "#7C3AED",
  "#DB2777", "#0891B2", "#65A30D", "#DC2626", "#4F46E5",
];

const TIER_PRESETS = [
  { name: "Emergency Fund (3 months)", tier: 2 as const, color: "#EA580C" },
  { name: "Emergency Fund (6 months)", tier: 2 as const, color: "#EA580C" },
  { name: "Insurance Premium Fund", tier: 2 as const, color: "#F97316" },
  { name: "Family Obligations Fund", tier: 3 as const, color: "#D97706" },
  { name: "Education Fund", tier: 3 as const, color: "#F59E0B" },
  { name: "Investment Starter Fund", tier: 4 as const, color: "#16A34A" },
  { name: "Business Capital Fund", tier: 4 as const, color: "#22C55E" },
  { name: "House Down Payment", tier: 4 as const, color: "#0891B2" },
  { name: "Legacy Portfolio", tier: 5 as const, color: "#2563EB" },
];

type GoalForm = Omit<SavingsGoal, "id">;

const emptyForm = (): GoalForm => ({
  name: "",
  description: "",
  target: 0,
  current: 0,
  tier: 2,
  color: "#EA580C",
  deadline: "",
});

export default function SavingsPage() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, profile } = useStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm());
  const [depositId, setDepositId] = useState<string | null>(null);
  const [depositAmt, setDepositAmt] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalSaved = savingsGoals.reduce((s, g) => s + g.current, 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + g.target, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  function openAdd() {
    setForm(emptyForm());
    setEditId(null);
    setShowAdd(true);
  }

  function openEdit(goal: SavingsGoal) {
    setForm({ ...goal });
    setEditId(goal.id);
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.name || form.target <= 0) return;
    if (editId) {
      updateSavingsGoal(editId, form);
    } else {
      addSavingsGoal(form);
    }
    setShowAdd(false);
  }

  function handleDeposit(id: string) {
    const amt = parseFloat(depositAmt);
    if (isNaN(amt) || amt <= 0) return;
    const goal = savingsGoals.find((g) => g.id === id);
    if (!goal) return;
    updateSavingsGoal(id, { current: Math.min(goal.current + amt, goal.target) });
    setDepositId(null);
    setDepositAmt("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Goals"
        subtitle="Track every savings target across all 5 tiers"
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="w-4 h-4" /> New goal
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Total saved" value={`GH₵ ${Math.round(totalSaved).toLocaleString()}`} accent="#16A34A" />
        <MetricCard label="Total targets" value={`GH₵ ${Math.round(totalTarget).toLocaleString()}`} />
        <MetricCard label="Overall progress" value={`${Math.round(overallPct)}%`} sub={`${savingsGoals.length} goals`} />
      </div>

      {/* Goals */}
      {savingsGoals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-6 h-6" />}
          title="No savings goals yet"
          description="Create your first goal — start with your Emergency Fund (Tier 2)."
          action={<button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add first goal</button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {savingsGoals.map((goal) => {
            const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
            const remaining = Math.max(0, goal.target - goal.current);
            const tc = TIER_CONFIG[goal.tier as keyof typeof TIER_CONFIG];
            const monthlyAlloc = profile.monthlyIncome * (tc.pct / 100);
            const months = calcMonthsToGoal(goal.current, goal.target, monthlyAlloc * 0.5);

            return (
              <div key={goal.id} className="card flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ProgressRing pct={pct} size={56} stroke={5} color={goal.color}>
                      <span className="text-xs font-bold" style={{ color: goal.color }}>
                        {Math.round(pct)}%
                      </span>
                    </ProgressRing>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{goal.name}</h3>
                      {goal.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{goal.description}</p>
                      )}
                      <TierBadge tier={goal.tier} size="sm" label={`Tier ${goal.tier}: ${tc.short}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(goal)} className="text-gray-300 hover:text-gray-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(goal.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>GH₵ {Math.round(goal.current).toLocaleString()} saved</span>
                    <span>Target: GH₵ {Math.round(goal.target).toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                  <div className="text-xs text-gray-400">
                    {pct >= 100 ? (
                      <span className="text-green-600 font-medium">Goal reached!</span>
                    ) : months !== null ? (
                      `~${months} months at current rate`
                    ) : (
                      fmt(remaining) + " remaining"
                    )}
                  </div>
                  <button
                    className="btn-secondary text-xs py-1.5"
                    onClick={() => { setDepositId(goal.id); setDepositAmt(""); }}
                    disabled={pct >= 100}
                  >
                    <TrendingUp className="w-3 h-3" /> Add funds
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Maslow alignment note */}
      <SectionCard title="Maslow savings sequencing">
        <p className="text-sm text-gray-600 leading-relaxed">
          Complete savings goals in tier order. Build your Tier 2 Emergency Fund before opening
          Tier 3 family or education funds. Do not invest (Tier 4) while you have high-interest
          debt or no emergency fund. Maslow is clear: unmet lower needs hijack your financial
          decision-making.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as const).map((t) => {
            const tc = TIER_CONFIG[t];
            const hasGoals = savingsGoals.some((g) => g.tier === t);
            return (
              <div
                key={t}
                className="text-center p-2 rounded-lg text-xs"
                style={{ backgroundColor: hasGoals ? tc.light : "#F9F9F7", color: hasGoals ? tc.dark : "#9CA3AF" }}
              >
                <div className="font-semibold">{t}</div>
                <div>{tc.short}</div>
                {hasGoals && <div className="mt-1 w-2 h-2 rounded-full mx-auto" style={{ backgroundColor: tc.color }} />}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Add/Edit Modal */}
      {showAdd && (
        <Modal
          title={editId ? "Edit savings goal" : "New savings goal"}
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                {editId ? "Save changes" : "Create goal"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">Goal name</label>
              <input className="input" placeholder="e.g. Emergency Fund" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Quick preset</label>
              <select className="input" onChange={(e) => {
                const preset = TIER_PRESETS[+e.target.value];
                if (preset) setForm((f) => ({ ...f, name: preset.name, tier: preset.tier, color: preset.color }));
              }}>
                <option value="">— Select preset —</option>
                {TIER_PRESETS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input className="input" placeholder="What is this for?" value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Target amount (GH₵)</label>
                <input type="number" className="input" min="0" value={form.target || ""}
                  onChange={(e) => setForm((f) => ({ ...f, target: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Current amount (GH₵)</label>
                <input type="number" className="input" min="0" value={form.current || ""}
                  onChange={(e) => setForm((f) => ({ ...f, current: +e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Maslow tier</label>
                <select className="input" value={form.tier}
                  onChange={(e) => setForm((f) => ({ ...f, tier: +e.target.value as 1 | 2 | 3 | 4 | 5 }))}>
                  {([1, 2, 3, 4, 5] as const).map((t) => (
                    <option key={t} value={t}>Tier {t} — {TIER_CONFIG[t].name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="label">Target deadline (optional)</label>
              <input type="date" className="input" value={form.deadline || ""}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* Deposit modal */}
      {depositId && (
        <Modal
          title="Add funds to goal"
          onClose={() => setDepositId(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setDepositId(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => handleDeposit(depositId)}>Add funds</button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Adding to: <strong>{savingsGoals.find((g) => g.id === depositId)?.name}</strong>
            </p>
            <div>
              <label className="label">Amount (GH₵)</label>
              <input type="number" className="input" placeholder="0.00" min="0" step="0.01"
                value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} autoFocus />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal
          title="Delete savings goal"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => { deleteSavingsGoal(deleteId); setDeleteId(null); }}>Delete</button>
            </>
          }
        >
          <p className="text-sm text-gray-600">This will permanently delete this savings goal.</p>
        </Modal>
      )}
    </div>
  );
}
