export interface Advance {
  _id: string;
  amount: number;
  currency: string;
  advance_source_name: string;
  advance_source_phn: string;
  advance_source_email: string;
  advance_type: string;
  repayment_status: string;
  repaid_amount?: number;
  proof_of_payment?: string;
  purpose: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: string;
}

export interface CreateAdvancePayload {
  amount: number;
  currency: string;
  advance_source_name: string;
  advance_source_phn: string;
  advance_source_email: string;
  advance_type: string;
  repayment_status: string;
  proof_of_payment?: string;
  purpose: string;
}

export interface Repayment {
  _id: string;
  advance_id: string;
  amount: number;
  proof_of_payment?: string;
  user: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface CreateRepaymentPayload {
  advance_id: string;
  amount: number;
  proof_of_payment: string;
}

export interface AdvanceOverview {
  totalAdvanceUSD: number;
  totalRepaidUSD: number;
  outstandingUSD: number;
  totalAdvanceSources: number;
}

export interface AdvanceTrendItem {
  totalUSD: number;
  date: string;
}

export interface TypePercentage {
  marketting: {
    totalUSD: number;
    percentage: number;
  };
  personal: {
    totalUSD: number;
    percentage: number;
  };
}
