"use client";
import { useState } from "react";
import { User, Download, Trash2, AlertCircle, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { DEFAULT_MILESTONES, DEFAULT_CADENCE_ITEMS } from "@/lib/constants";
import { PageHeader, SectionCard, Modal } from "@/components/ui";

export default function SettingsPage() {
  const { profile, updateProfile, transactions, debts, savingsGoals, budgetCategories } = useStore();
  const store = useStore();

  const [form, setForm] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  function handleSave() {
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportData() {
    const data = {
      profile,
      transactions,
      debts,
      savingsGoals,
      budgetCategories,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maslow-finance-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.transactions) store.transactions.splice(0);
        if (data.profile) updateProfile(data.profile);
        alert("Import successful! Refresh the page to see all data.");
      } catch {
        alert("Import failed. Please check the file format.");
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("maslow-finance-v1");
      window.location.reload();
    }
  }

  const stats = {
    transactions: transactions.length,
    totalExpenses: transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    totalIncome: transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    debts: debts.length,
    goals: savingsGoals.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Profile, preferences, and data management" />

      {/* Profile */}
      <SectionCard title="Your profile" action={
        <button className="btn-primary text-xs" onClick={handleSave}>
          <Save className="w-3.5 h-3.5" /> {saved ? "Saved!" : "Save"}
        </button>
      }>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="label">Your name</label>
            <input
              className="input"
              placeholder="e.g. Elinart"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly income (GH₵)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={form.monthlyIncome || ""}
                onChange={(e) => setForm((f) => ({ ...f, monthlyIncome: +e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Used for tier detection and budget allocations</p>
            </div>
            <div>
              <label className="label">Age</label>
              <input
                type="number"
                className="input"
                min="18"
                max="80"
                value={form.age || ""}
                onChange={(e) => setForm((f) => ({ ...f, age: +e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Number of dependants</label>
            <select
              className="input"
              value={form.dependants}
              onChange={(e) => setForm((f) => ({ ...f, dependants: +e.target.value }))}
            >
              <option value={0}>None</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3+</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Affects emergency fund calculation and family obligation budgeting</p>
          </div>
        </div>
      </SectionCard>

      {/* Data summary */}
      <SectionCard title="Your data">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Transactions", value: stats.transactions },
            { label: "Savings goals", value: stats.goals },
            { label: "Debts tracked", value: stats.debts },
            { label: "Budget categories", value: budgetCategories.length },
          ].map(({ label, value }) => (
            <div key={label} className="card-sm text-center">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          All data is stored locally in your browser using localStorage. Nothing is sent to any server.
          Export regularly to avoid data loss when clearing your browser.
        </p>
      </SectionCard>

      {/* Export / Import */}
      <SectionCard title="Export & import">
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={exportData}>
            <Download className="w-4 h-4" /> Export all data (JSON)
          </button>
          <label className="btn-secondary cursor-pointer">
            <input type="file" accept=".json" className="hidden" onChange={importData} />
            Import backup
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          Export creates a full JSON backup of all your transactions, goals, debts, and settings.
          Import restores from a previous backup.
        </p>
      </SectionCard>

      {/* Maslow framework summary */}
      <div className="card" style={{ borderLeft: "3px solid #2563EB", borderRadius: 0 }}>
        <div className="section-title">About Maslow Finance</div>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          This system maps Abraham Maslow's Hierarchy of Needs directly onto personal finance.
          You cannot build lasting wealth while lower-tier needs are unmet — the brain literally
          cannot prioritize long-term thinking when survival is uncertain.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {([
            { t: 1, c: "#DC2626", bg: "#FEF2F2", label: "Survival" },
            { t: 2, c: "#EA580C", bg: "#FFF7ED", label: "Security" },
            { t: 3, c: "#D97706", bg: "#FFFBEB", label: "Family" },
            { t: 4, c: "#16A34A", bg: "#F0FDF4", label: "Wealth" },
            { t: 5, c: "#2563EB", bg: "#EFF6FF", label: "Legacy" },
          ]).map(({ t, c, bg, label }) => (
            <div key={t} className="text-center p-2 rounded-lg text-xs font-medium" style={{ backgroundColor: bg, color: c }}>
              <div className="text-base font-bold">{t}</div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Reset */}
      <SectionCard title="Danger zone">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-800 mb-1">Reset all data</div>
            <p className="text-xs text-red-600 mb-3">
              This permanently deletes all transactions, goals, debts, and settings.
              Export your data first.
            </p>
            <button className="btn-danger text-xs" onClick={() => setShowReset(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Reset everything
            </button>
          </div>
        </div>
      </SectionCard>

      {showReset && (
        <Modal
          title="Reset all data"
          onClose={() => setShowReset(false)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShowReset(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleReset}>Yes, delete everything</button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            This will permanently erase all your financial data. This cannot be undone.
            Have you exported a backup?
          </p>
        </Modal>
      )}
    </div>
  );
}
