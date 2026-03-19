"use client";
import { useState, useMemo } from "react";
import { Plus, Trash2, Edit2, CreditCard, TrendingDown, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmt, fmtShort } from "@/lib/utils";
import { PageHeader, Modal, EmptyState, MetricCard, SectionCard, ProgressRing } from "@/components/ui";
import type { Debt } from "@/lib/types";

type DebtForm = Omit<Debt, "id">;

const emptyForm = (): DebtForm => ({
  name: "",
  lender: "",
  originalAmount: 0,
  currentBalance: 0,
  interestRate: 0,
  monthlyPayment: 0,
  startDate: new Date().toISOString().slice(0, 10),
});

export default function DebtsPage() {
  const { debts, addDebt, updateDebt, deleteDebt, profile } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<DebtForm>(emptyForm());
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalDebt = useMemo(() => debts.reduce((s, d) => s + d.currentBalance, 0), [debts]);
  const totalOriginal = useMemo(() => debts.reduce((s, d) => s + d.originalAmount, 0), [debts]);
  const totalMonthly = useMemo(() => debts.reduce((s, d) => s + d.monthlyPayment, 0), [debts]);
  const highestRate = useMemo(() => (debts.length > 0 ? Math.max(...debts.map((d) => d.interestRate)) : 0), [debts]);
  const paidOff = totalOriginal > 0 ? ((totalOriginal - totalDebt) / totalOriginal) * 100 : 0;

  // Sorted by interest rate (avalanche method)
  const sorted = useMemo(() => [...debts].sort((a, b) => b.interestRate - a.interestRate), [debts]);

  function openAdd() {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(debt: Debt) {
    setForm({ ...debt });
    setEditId(debt.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name || form.currentBalance < 0) return;
    if (editId) {
      updateDebt(editId, form);
    } else {
      addDebt(form);
    }
    setShowForm(false);
  }

  function handlePayment(id: string) {
    const amt = parseFloat(payAmt);
    if (isNaN(amt) || amt <= 0) return;
    const debt = debts.find((d) => d.id === id);
    if (!debt) return;
    const newBal = Math.max(0, debt.currentBalance - amt);
    updateDebt(id, { currentBalance: newBal });
    if (newBal === 0) {
      // Mark as paid off - could delete or keep at 0
    }
    setPayId(null);
    setPayAmt("");
  }

  function monthsToPayoff(debt: Debt): number | null {
    if (debt.monthlyPayment <= 0) return null;
    const r = debt.interestRate / 100 / 12;
    if (r === 0) return Math.ceil(debt.currentBalance / debt.monthlyPayment);
    const n = Math.log(debt.monthlyPayment / (debt.monthlyPayment - r * debt.currentBalance)) / Math.log(1 + r);
    return isFinite(n) && n > 0 ? Math.ceil(n) : null;
  }

  function totalInterest(debt: Debt): number {
    const mo = monthsToPayoff(debt);
    if (!mo) return 0;
    return Math.max(0, debt.monthlyPayment * mo - debt.currentBalance);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Debts"
        subtitle="Avalanche method — highest interest rate first"
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add debt
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total debt" value={fmtShort(totalDebt)} accent={totalDebt > 0 ? "#DC2626" : "#16A34A"} />
        <MetricCard label="Monthly payments" value={fmtShort(totalMonthly)} sub={`${Math.round((totalMonthly / (profile.monthlyIncome || 1)) * 100)}% of income`} />
        <MetricCard label="Highest rate" value={`${highestRate.toFixed(1)}%`} accent={highestRate > 25 ? "#DC2626" : highestRate > 15 ? "#D97706" : "#16A34A"} />
        <MetricCard label="Overall paid off" value={`${Math.round(paidOff)}%`} accent="#2563EB" />
      </div>

      {/* Avalanche guide */}
      {debts.length > 1 && (
        <div className="card" style={{ borderLeft: "3px solid #DC2626", borderRadius: 0 }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-0.5">Avalanche method active</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pay minimums on all debts. Direct every extra payment to{" "}
                <strong className="text-gray-700">{sorted[0]?.name}</strong> ({sorted[0]?.interestRate}% rate) first.
                When it's gone, attack the next highest. This saves the most money.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debt list */}
      {debts.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-6 h-6" />}
          title="No debts tracked"
          description="Add any outstanding loans, credit card balances, or informal debts to track your elimination progress."
          action={<button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add first debt</button>}
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((debt, i) => {
            const pct = debt.originalAmount > 0 ? ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100 : 0;
            const months = monthsToPayoff(debt);
            const interest = totalInterest(debt);
            const isTarget = i === 0 && sorted.length > 1;

            return (
              <div
                key={debt.id}
                className="card"
                style={isTarget ? { borderColor: "#DC2626", borderWidth: "1.5px" } : {}}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ProgressRing pct={pct} size={52} stroke={5} color={pct >= 100 ? "#16A34A" : "#DC2626"}>
                      <span className="text-[10px] font-bold text-gray-600">{Math.round(pct)}%</span>
                    </ProgressRing>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{debt.name}</h3>
                        {isTarget && (
                          <span className="badge text-[10px]" style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}>
                            Attack first
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{debt.lender} · {debt.interestRate}% APR</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(debt)} className="text-gray-300 hover:text-gray-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(debt.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="card-sm">
                    <div className="text-xs text-gray-400 mb-0.5">Current balance</div>
                    <div className="text-base font-semibold text-red-600">{fmt(debt.currentBalance)}</div>
                  </div>
                  <div className="card-sm">
                    <div className="text-xs text-gray-400 mb-0.5">Monthly payment</div>
                    <div className="text-base font-semibold">{fmt(debt.monthlyPayment)}</div>
                  </div>
                  <div className="card-sm">
                    <div className="text-xs text-gray-400 mb-0.5">Est. payoff</div>
                    <div className="text-base font-semibold">
                      {months ? `${months} mo` : "—"}
                    </div>
                  </div>
                </div>

                {interest > 0 && (
                  <p className="text-xs text-gray-400 mb-3">
                    At current rate, you'll pay <strong className="text-red-500">{fmt(interest)}</strong> in total interest.
                    Every extra payment reduces this.
                  </p>
                )}

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? "#16A34A" : "#DC2626" }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Paid: {fmt(debt.originalAmount - debt.currentBalance)} of {fmt(debt.originalAmount)}
                  </span>
                  <button
                    className="btn-secondary text-xs py-1.5"
                    onClick={() => { setPayId(debt.id); setPayAmt(""); }}
                    disabled={debt.currentBalance === 0}
                  >
                    <TrendingDown className="w-3 h-3" /> Record payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <Modal
          title={editId ? "Edit debt" : "Add debt"}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>{editId ? "Save changes" : "Add debt"}</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Debt name</label>
                <input className="input" placeholder="e.g. Personal loan" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Lender</label>
                <input className="input" placeholder="e.g. GCB Bank" value={form.lender}
                  onChange={(e) => setForm((f) => ({ ...f, lender: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Original amount (GH₵)</label>
                <input type="number" className="input" min="0" value={form.originalAmount || ""}
                  onChange={(e) => setForm((f) => ({ ...f, originalAmount: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Current balance (GH₵)</label>
                <input type="number" className="input" min="0" value={form.currentBalance || ""}
                  onChange={(e) => setForm((f) => ({ ...f, currentBalance: +e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Interest rate (% APR)</label>
                <input type="number" className="input" min="0" step="0.1" value={form.interestRate || ""}
                  onChange={(e) => setForm((f) => ({ ...f, interestRate: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Monthly payment (GH₵)</label>
                <input type="number" className="input" min="0" value={form.monthlyPayment || ""}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyPayment: +e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Start date</label>
              <input type="date" className="input" value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            {form.interestRate > 25 && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">
                This debt has a very high interest rate ({form.interestRate}%). Prioritize eliminating it immediately — it is costing you significantly.
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Payment modal */}
      {payId && (
        <Modal
          title="Record payment"
          onClose={() => setPayId(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setPayId(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => handlePayment(payId)}>Record</button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Recording payment for: <strong>{debts.find((d) => d.id === payId)?.name}</strong>
            </p>
            <p className="text-xs text-gray-400">
              Current balance: {fmt(debts.find((d) => d.id === payId)?.currentBalance || 0)}
            </p>
            <div>
              <label className="label">Payment amount (GH₵)</label>
              <input type="number" className="input" placeholder="0.00" min="0" step="0.01"
                value={payAmt} onChange={(e) => setPayAmt(e.target.value)} autoFocus />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal
          title="Delete debt"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => { deleteDebt(deleteId); setDeleteId(null); }}>Delete</button>
            </>
          }
        >
          <p className="text-sm text-gray-600">This will permanently remove this debt from your tracker.</p>
        </Modal>
      )}
    </div>
  );
}
