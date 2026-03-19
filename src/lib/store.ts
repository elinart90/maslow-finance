import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_BUDGET_CATEGORIES,
  DEFAULT_MILESTONES,
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

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export { supabase };

// ─── Helper: get current user id (throws if not logged in) ───────────────────
async function uid(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Store interface ──────────────────────────────────────────────────────────
interface FinanceStore {
  // Auth
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;

  // Profile
  profile: Profile;
  updateProfile: (data: Partial<Profile>) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  loadTransactions: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget categories (kept local — per-user limits stored in profiles table as JSON)
  budgetCategories: BudgetCategory[];
  updateBudgetLimit: (category: string, limit: number) => Promise<void>;

  // Savings goals
  savingsGoals: SavingsGoal[];
  loadSavingsGoals: () => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, "id">) => Promise<void>;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  // Debts
  debts: Debt[];
  loadDebts: () => Promise<void>;
  addDebt: (debt: Omit<Debt, "id">) => Promise<void>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  // Tier milestones
  tierMilestones: TierMilestone[];
  loadMilestones: () => Promise<void>;
  toggleMilestone: (id: string) => Promise<void>;

  // Cadence completions
  cadenceCompletions: CadenceCompletion[];
  loadCadenceCompletions: () => Promise<void>;
  completeCadenceItem: (itemId: string, periodKey: string) => Promise<void>;
  uncompleteCadenceItem: (itemId: string, periodKey: string) => Promise<void>;

  // Selected month (local UI state only)
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // Load everything at once after login
  loadAllData: () => Promise<void>;
}

// ─── Current month key ────────────────────────────────────────────────────────
const now = new Date();
const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStore = create<FinanceStore>()((set, get) => ({

  // ── Auth ────────────────────────────────────────────────────────────────────
  userId: null,
  isLoading: true,
  isAuthenticated: false,

  initAuth: async () => {
    set({ isLoading: true });

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      set({ userId: session.user.id, isAuthenticated: true });
      await get().loadAllData();
    }

    // Listen for auth state changes (login / logout / token refresh)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        set({ userId: session.user.id, isAuthenticated: true });
        await get().loadAllData();
      }
      if (event === "SIGNED_OUT") {
        set({
          userId: null,
          isAuthenticated: false,
          transactions: [],
          savingsGoals: [],
          debts: [],
          tierMilestones: DEFAULT_MILESTONES,
          cadenceCompletions: [],
          profile: { name: "", monthlyIncome: 5000, age: 24, dependants: 0 },
          budgetCategories: DEFAULT_BUDGET_CATEGORIES,
        });
      }
    });

    set({ isLoading: false });
  },

  signIn: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : "",
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  // ── Load all data ────────────────────────────────────────────────────────────
  loadAllData: async () => {
    await Promise.all([
      get().loadTransactions(),
      get().loadSavingsGoals(),
      get().loadDebts(),
      get().loadMilestones(),
      get().loadCadenceCompletions(),
      // Load profile separately
      (async () => {
        const userId = get().userId;
        if (!userId) return;
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (data) {
          set({
            profile: {
              name: data.name || "",
              monthlyIncome: data.monthly_income || 5000,
              age: data.age || 24,
              dependants: data.dependants || 0,
            },
            // Budget limits are stored as JSON column in profiles
            budgetCategories: data.budget_categories
              ? JSON.parse(data.budget_categories)
              : DEFAULT_BUDGET_CATEGORIES,
          });
        } else {
          // First time login — create profile row
          await supabase.from("profiles").insert({
            id: userId,
            name: "",
            monthly_income: 5000,
            age: 24,
            dependants: 0,
            budget_categories: JSON.stringify(DEFAULT_BUDGET_CATEGORIES),
          });
          // Seed default milestones for this user
          const milestones = DEFAULT_MILESTONES.map((m) => ({
            id: m.id,
            user_id: userId,
            tier: m.tier,
            text: m.text,
            completed: false,
            completed_date: null,
          }));
          await supabase.from("tier_milestones").upsert(milestones);
          set({ tierMilestones: DEFAULT_MILESTONES });
          // Seed default emergency fund goal
          await supabase.from("savings_goals").upsert({
            id: "sg_emergency",
            user_id: userId,
            name: "Emergency Fund",
            description: "6 months of expenses for financial safety",
            target: 18000,
            current: 0,
            tier: 2,
            color: "#EA580C",
          });
        }
      })(),
    ]);
  },

  // ── Profile ──────────────────────────────────────────────────────────────────
  profile: {
    name: "",
    monthlyIncome: 5000,
    age: 24,
    dependants: 0,
  },

  updateProfile: async (data) => {
    const userId = get().userId;
    if (!userId) return;

    set((s) => ({ profile: { ...s.profile, ...data } }));

    await supabase.from("profiles").update({
      name: data.name ?? get().profile.name,
      monthly_income: data.monthlyIncome ?? get().profile.monthlyIncome,
      age: data.age ?? get().profile.age,
      dependants: data.dependants ?? get().profile.dependants,
    }).eq("id", userId);
  },

  // ── Transactions ─────────────────────────────────────────────────────────────
  transactions: [],

  loadTransactions: async () => {
    const userId = get().userId;
    if (!userId) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) { console.error("loadTransactions:", error); return; }

    const mapped: Transaction[] = (data || []).map((r) => ({
      id: r.id,
      date: r.date,
      amount: r.amount,
      category: r.category,
      description: r.description || "",
      type: r.type,
    }));

    set({ transactions: mapped });
  },

  addTransaction: async (t) => {
    const userId = get().userId;
    if (!userId) return;

    const id = generateId();
    const row = {
      id,
      user_id: userId,
      date: t.date,
      amount: t.amount,
      category: t.category,
      description: t.description || "",
      type: t.type,
    };

    // Optimistic update
    set((s) => ({
      transactions: [{ ...t, id }, ...s.transactions].sort(
        (a, b) => b.date.localeCompare(a.date)
      ),
    }));

    const { error } = await supabase.from("transactions").insert(row);
    if (error) {
      console.error("addTransaction:", error);
      // Rollback
      set((s) => ({ transactions: s.transactions.filter((tx) => tx.id !== id) }));
    }
  },

  updateTransaction: async (id, data) => {
    const userId = get().userId;
    if (!userId) return;

    // Optimistic update
    set((s) => ({
      transactions: s.transactions.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    }));

    const { error } = await supabase
      .from("transactions")
      .update({
        date: data.date,
        amount: data.amount,
        category: data.category,
        description: data.description,
        type: data.type,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("updateTransaction:", error);
      await get().loadTransactions(); // Refetch on error
    }
  },

  deleteTransaction: async (id) => {
    const userId = get().userId;
    if (!userId) return;

    // Optimistic update
    const prev = get().transactions;
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("deleteTransaction:", error);
      set({ transactions: prev }); // Rollback
    }
  },

  // ── Budget categories ────────────────────────────────────────────────────────
  // Stored as a JSON column in the profiles table to avoid a separate table
  budgetCategories: DEFAULT_BUDGET_CATEGORIES,

  updateBudgetLimit: async (category, limit) => {
    const userId = get().userId;
    if (!userId) return;

    const updated = get().budgetCategories.map((c) =>
      c.category === category ? { ...c, monthlyLimit: limit } : c
    );

    set({ budgetCategories: updated });

    await supabase
      .from("profiles")
      .update({ budget_categories: JSON.stringify(updated) })
      .eq("id", userId);
  },

  // ── Savings goals ────────────────────────────────────────────────────────────
  savingsGoals: [],

  loadSavingsGoals: async () => {
    const userId = get().userId;
    if (!userId) return;

    const { data, error } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) { console.error("loadSavingsGoals:", error); return; }

    const mapped: SavingsGoal[] = (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      target: r.target,
      current: r.current,
      tier: r.tier,
      color: r.color || "#EA580C",
      deadline: r.deadline || undefined,
    }));

    set({ savingsGoals: mapped });
  },

  addSavingsGoal: async (goal) => {
    const userId = get().userId;
    if (!userId) return;

    const id = generateId();
    const row = {
      id,
      user_id: userId,
      name: goal.name,
      description: goal.description || "",
      target: goal.target,
      current: goal.current || 0,
      tier: goal.tier,
      color: goal.color || "#EA580C",
      deadline: goal.deadline || null,
    };

    // Optimistic
    set((s) => ({ savingsGoals: [...s.savingsGoals, { ...goal, id }] }));

    const { error } = await supabase.from("savings_goals").insert(row);
    if (error) {
      console.error("addSavingsGoal:", error);
      set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) }));
    }
  },

  updateSavingsGoal: async (id, data) => {
    const userId = get().userId;
    if (!userId) return;

    set((s) => ({
      savingsGoals: s.savingsGoals.map((g) =>
        g.id === id ? { ...g, ...data } : g
      ),
    }));

    const { error } = await supabase
      .from("savings_goals")
      .update({
        name: data.name,
        description: data.description,
        target: data.target,
        current: data.current,
        tier: data.tier,
        color: data.color,
        deadline: data.deadline || null,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("updateSavingsGoal:", error);
      await get().loadSavingsGoals();
    }
  },

  deleteSavingsGoal: async (id) => {
    const userId = get().userId;
    if (!userId) return;

    const prev = get().savingsGoals;
    set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) }));

    const { error } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("deleteSavingsGoal:", error);
      set({ savingsGoals: prev });
    }
  },

  // ── Debts ────────────────────────────────────────────────────────────────────
  debts: [],

  loadDebts: async () => {
    const userId = get().userId;
    if (!userId) return;

    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", userId)
      .order("interest_rate", { ascending: false });

    if (error) { console.error("loadDebts:", error); return; }

    const mapped: Debt[] = (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      lender: r.lender || "",
      originalAmount: r.original_amount,
      currentBalance: r.current_balance,
      interestRate: r.interest_rate,
      monthlyPayment: r.monthly_payment,
      startDate: r.start_date || "",
    }));

    set({ debts: mapped });
  },

  addDebt: async (debt) => {
    const userId = get().userId;
    if (!userId) return;

    const id = generateId();
    const row = {
      id,
      user_id: userId,
      name: debt.name,
      lender: debt.lender || "",
      original_amount: debt.originalAmount,
      current_balance: debt.currentBalance,
      interest_rate: debt.interestRate,
      monthly_payment: debt.monthlyPayment,
      start_date: debt.startDate || null,
    };

    set((s) => ({
      debts: [...s.debts, { ...debt, id }].sort(
        (a, b) => b.interestRate - a.interestRate
      ),
    }));

    const { error } = await supabase.from("debts").insert(row);
    if (error) {
      console.error("addDebt:", error);
      set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }));
    }
  },

  updateDebt: async (id, data) => {
    const userId = get().userId;
    if (!userId) return;

    set((s) => ({
      debts: s.debts.map((d) => (d.id === id ? { ...d, ...data } : d)),
    }));

    const { error } = await supabase
      .from("debts")
      .update({
        name: data.name,
        lender: data.lender,
        original_amount: data.originalAmount,
        current_balance: data.currentBalance,
        interest_rate: data.interestRate,
        monthly_payment: data.monthlyPayment,
        start_date: data.startDate,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("updateDebt:", error);
      await get().loadDebts();
    }
  },

  deleteDebt: async (id) => {
    const userId = get().userId;
    if (!userId) return;

    const prev = get().debts;
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }));

    const { error } = await supabase
      .from("debts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("deleteDebt:", error);
      set({ debts: prev });
    }
  },

  // ── Tier milestones ──────────────────────────────────────────────────────────
  tierMilestones: DEFAULT_MILESTONES,

  loadMilestones: async () => {
    const userId = get().userId;
    if (!userId) return;

    const { data, error } = await supabase
      .from("tier_milestones")
      .select("*")
      .eq("user_id", userId)
      .order("tier", { ascending: true });

    if (error) { console.error("loadMilestones:", error); return; }

    if (!data || data.length === 0) return; // Will be seeded in loadAllData

    const mapped: TierMilestone[] = data.map((r) => ({
      id: r.id,
      tier: r.tier,
      text: r.text,
      completed: r.completed,
      completedDate: r.completed_date || undefined,
    }));

    set({ tierMilestones: mapped });
  },

  toggleMilestone: async (id) => {
    const userId = get().userId;
    if (!userId) return;

    const milestone = get().tierMilestones.find((m) => m.id === id);
    if (!milestone) return;

    const newCompleted = !milestone.completed;
    const completedDate = newCompleted ? new Date().toISOString() : null;

    // Optimistic
    set((s) => ({
      tierMilestones: s.tierMilestones.map((m) =>
        m.id === id
          ? { ...m, completed: newCompleted, completedDate: completedDate || undefined }
          : m
      ),
    }));

    const { error } = await supabase
      .from("tier_milestones")
      .update({ completed: newCompleted, completed_date: completedDate })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("toggleMilestone:", error);
      await get().loadMilestones();
    }
  },

  // ── Cadence completions ──────────────────────────────────────────────────────
  cadenceCompletions: [],

  loadCadenceCompletions: async () => {
    const userId = get().userId;
    if (!userId) return;

    const { data, error } = await supabase
      .from("cadence_completions")
      .select("*")
      .eq("user_id", userId);

    if (error) { console.error("loadCadenceCompletions:", error); return; }

    const mapped: CadenceCompletion[] = (data || []).map((r) => ({
      itemId: r.item_id,
      periodKey: r.period_key,
      completedAt: r.completed_at,
    }));

    set({ cadenceCompletions: mapped });
  },

  completeCadenceItem: async (itemId, periodKey) => {
    const userId = get().userId;
    if (!userId) return;

    const exists = get().cadenceCompletions.find(
      (c) => c.itemId === itemId && c.periodKey === periodKey
    );
    if (exists) return;

    const completedAt = new Date().toISOString();

    // Optimistic
    set((s) => ({
      cadenceCompletions: [
        ...s.cadenceCompletions,
        { itemId, periodKey, completedAt },
      ],
    }));

    const { error } = await supabase.from("cadence_completions").insert({
      user_id: userId,
      item_id: itemId,
      period_key: periodKey,
      completed_at: completedAt,
    });

    if (error) {
      console.error("completeCadenceItem:", error);
      set((s) => ({
        cadenceCompletions: s.cadenceCompletions.filter(
          (c) => !(c.itemId === itemId && c.periodKey === periodKey)
        ),
      }));
    }
  },

  uncompleteCadenceItem: async (itemId, periodKey) => {
    const userId = get().userId;
    if (!userId) return;

    // Optimistic
    set((s) => ({
      cadenceCompletions: s.cadenceCompletions.filter(
        (c) => !(c.itemId === itemId && c.periodKey === periodKey)
      ),
    }));

    const { error } = await supabase
      .from("cadence_completions")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("period_key", periodKey);

    if (error) {
      console.error("uncompleteCadenceItem:", error);
      await get().loadCadenceCompletions();
    }
  },

  // ── UI state ──────────────────────────────────────────────────────────────────
  selectedMonth: currentMonthKey,
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}));