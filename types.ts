
export enum BudgetCategory {
  NEED = 'Need',
  WANT = 'Want',
  SAVINGS = 'Savings'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: BudgetCategory;
  subCategory: string;
}

export interface BudgetStats {
  needs: number;
  wants: number;
  savings: number;
  totalIncome: number;
}

export interface AnalysisInsights {
  summary: string;
  forecast: string;
  recommendations: string[];
}

export type AppView = 'overview' | 'historical' | 'transactions' | 'settings' | 'audit';

export interface UserProfile {
  title: 'Mr.' | 'Mrs.' | 'Ms.' | 'Dr.';
  name: string;
  email: string;
  avatar?: string;
}
