export type TransactionCategory =
  | "housing"
  | "food"
  | "transport"
  | "utilities"
  | "airtime"
  | "health"
  | "insurance"
  | "family"
  | "education"
  | "entertainment"
  | "clothing"
  | "business"
  | "investment"
  | "debt_payment"
  | "savings_transfer"
  | "salary"
  | "side_income"
  | "other";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: TransactionCategory;
  description: string;
  type: TransactionType;
}

export interface BudgetCategory {
  category: TransactionCategory;
  name: string;
  monthlyLimit: number;
  tier: 1 | 2 | 3 | 4 | 5;
  color: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  tier: 1 | 2 | 3 | 4 | 5;
  deadline?: string;
  color: string;
}

export interface Debt {
  id: string;
  name: string;
  lender: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
}

export interface TierMilestone {
  id: string;
  tier: 1 | 2 | 3 | 4 | 5;
  text: string;
  completed: boolean;
  completedDate?: string;
}

export interface CadenceItem {
  id: string;
  frequency: "weekly_mon" | "weekly_wed" | "weekly_fri" | "monthly" | "annual";
  title: string;
  description: string;
  month?: number; // 1-12 for annual items
}

export interface CadenceCompletion {
  itemId: string;
  periodKey: string; // YYYY-WW or YYYY-MM or YYYY
  completedAt: string;
}

export interface Profile {
  name: string;
  monthlyIncome: number;
  age: number;
  dependants: number;
}

export type TierNumber = 1 | 2 | 3 | 4 | 5;
