export interface CreateExpensePayload {
  expense_date: string;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  receipt_url?: string;
}

export interface Expense {
  _id: string;
  ref_id: string;
  expense_date: string;
  category: string;
  amount?: number;
  currency: string;
  description: string;
  receipt_url?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  user?: string;
}

export interface ExpenseTrendItem {
  amount: number;
  day: string;
}
