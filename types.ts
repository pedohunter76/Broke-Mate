
export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  recurrence?: 'weekly' | 'monthly' | 'yearly';
}

export interface Task {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedTime: string; // e.g. "2h"
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export enum AppTab {
  FINANCE = 'FINANCE',
  TIME = 'TIME',
  INSIGHTS = 'INSIGHTS'
}

export interface ReceiptData {
  merchant?: string;
  total?: number;
  date?: string;
  category?: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  aiAdvice: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number; // Monthly limit
}

export interface InsightResult {
  summary: string;
  correlations: string[];
  recommendation: string;
}

export interface TimeBlock {
  id: string;
  startTime: string; // 24h format "09:00"
  endTime: string;
  title: string;
  type: 'focus' | 'meeting' | 'break' | 'admin';
  suggestionReason: string;
}

export type EnergyLevel = 'High' | 'Medium' | 'Low';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextPaymentDate: string;
  status: 'active' | 'paused';
}
