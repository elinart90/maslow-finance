import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_BUDGET_CATEGORIES,
  DEFAULT_MILESTONES,
  DEFAULT_CADENCE_ITEMS,
} from "./constants";
import { generateId } from "./utils";
import type {
  Transaction,
  BudgetCategory,
  SavingsGoal,
  Debt,
  TierMilestone,
  CadenceCompletion,
  Profile,
} from "./types";

interface FinanceStore {
  profile: Profile;
  updateProfile: (data: Partial<Profile>) => void;

  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  budgetCategories: BudgetCategory[];
  updateBudgetLimit: (category: string, limit: number) => void;

  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, "id">) => void;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;

  debts: Debt[];
  addDebt: (debt: Omit<Debt, "id">) => void;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  tierMilestones: TierMilestone[];
  toggleMilestone: (id: string) => void;

  cadenceCompletions: CadenceCompletion[];
  completeCadenceItem: (itemId: string, periodKey: string) => void;
  uncompleteCadenceItem: (itemId: string, periodKey: string) => void;

  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

const now = new Date();
const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

export const useStore = create<FinanceStore>()(
  persist(
    (set) => ({
      profile: {
        name: "",
        monthlyIncome: 5000,
        age: 24,
        dependants: 0,
      },
      updateProfile: (data) =>
        set((s) => ({ profile: { ...s.profile, ...data } })),

      transactions: [],
      addTransaction: (t) =>
        set((s) => ({
          transactions: [
            { ...t, id: generateId() },
            ...s.transactions,
          ].sort((a, b) => b.date.localeCompare(a.date)),
        })),
      updateTransaction: (id, data) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),
      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),

      budgetCategories: DEFAULT_BUDGET_CATEGORIES,
      updateBudgetLimit: (category, limit) =>
        set((s) => ({
          budgetCategories: s.budgetCategories.map((c) =>
            c.category === category ? { ...c, monthlyLimit: limit } : c
          ),
        })),

      savingsGoals: [
        {
          id: "sg_emergency",
          name: "Emergency Fund",
          description: "6 months of expenses for financial safety",
          target: 18000,
          current: 0,
          tier: 2,
          color: "#EA580C",
        },
      ],
      addSavingsGoal: (goal) =>
        set((s) => ({
          savingsGoals: [...s.savingsGoals, { ...goal, id: generateId() }],
        })),
      updateSavingsGoal: (id, data) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === id ? { ...g, ...data } : g
          ),
        })),
      deleteSavingsGoal: (id) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.filter((g) => g.id !== id),
        })),

      debts: [],
      addDebt: (debt) =>
        set((s) => ({
          debts: [...s.debts, { ...debt, id: generateId() }].sort(
            (a, b) => b.interestRate - a.interestRate
          ),
        })),
      updateDebt: (id, data) =>
        set((s) => ({
          debts: s.debts.map((d) => (d.id === id ? { ...d, ...data } : d)),
        })),
      deleteDebt: (id) =>
        set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),

      tierMilestones: DEFAULT_MILESTONES,
      toggleMilestone: (id) =>
        set((s) => ({
          tierMilestones: s.tierMilestones.map((m) =>
            m.id === id
              ? {
                  ...m,
                  completed: !m.completed,
                  completedDate: !m.completed
                    ? new Date().toISOString()
                    : undefined,
                }
              : m
          ),
        })),

      cadenceCompletions: [],
      completeCadenceItem: (itemId, periodKey) =>
        set((s) => {
          const exists = s.cadenceCompletions.find(
            (c) => c.itemId === itemId && c.periodKey === periodKey
          );
          if (exists) return s;
          return {
            cadenceCompletions: [
              ...s.cadenceCompletions,
              { itemId, periodKey, completedAt: new Date().toISOString() },
            ],
          };
        }),
      uncompleteCadenceItem: (itemId, periodKey) =>
        set((s) => ({
          cadenceCompletions: s.cadenceCompletions.filter(
            (c) => !(c.itemId === itemId && c.periodKey === periodKey)
          ),
        })),

      selectedMonth: currentMonthKey,
      setSelectedMonth: (month) => set({ selectedMonth: month }),

      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "maslow-finance-v1",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
