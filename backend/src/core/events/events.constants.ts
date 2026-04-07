export const DOMAIN_EVENTS = {
  PARTNER_CREATED: 'partner.created',
  SALE_CREATED: 'sale.created',
  EXPENSE_CREATED: 'expense.created',
  WALLET_UPDATED: 'wallet.updated',
  SETTLEMENT_RECALCULATED: 'settlement.recalculated',
  INSIGHT_GENERATED: 'insight.generated',
  ALERT_TRIGGERED: 'alert.triggered',
} as const;

export const SOCKET_EVENTS = {
  DASHBOARD_UPDATED: 'dashboard.update',
  ALERT_CREATED: 'alert.triggered',
  TRANSACTION_CREATED: 'transaction.created',
  SETTLEMENT_UPDATED: 'settlement.updated',
  INSIGHT_CREATED: 'insight.generated',
} as const;

export type SaleCreatedEvent = {
  saleId: string;
  amount: string;
  paymentMode: 'CASH' | 'ONLINE';
  receivedByPartnerId: string;
  timestamp: string;
  initiatedByUserId?: string | null;
};

export type PartnerCreatedEvent = {
  partnerId: string;
  name: string;
  ownershipPercentage: string;
  createdAt: string;
};

export type ExpenseCreatedEvent = {
  expenseId: string;
  amount: string;
  category: string;
  paidByPartnerId: string;
  type: 'BUSINESS' | 'PERSONAL';
  paymentSource: 'CASH' | 'ONLINE';
  description?: string | null;
  timestamp: string;
  initiatedByUserId?: string | null;
};

export type WalletUpdatedEvent = {
  partnerId: string;
  partnerName: string;
  cashBalance: string;
  onlineBalance: string;
  totalBalance: string;
  sourceEvent: typeof DOMAIN_EVENTS.SALE_CREATED | typeof DOMAIN_EVENTS.EXPENSE_CREATED;
  sourceEntityId: string;
  updatedAt: string;
};

export type SettlementTransferEvent = {
  fromPartnerId: string;
  fromPartnerName: string;
  toPartnerId: string;
  toPartnerName: string;
  amount: string;
};

export type SettlementPartnerPositionEvent = {
  partnerId: string;
  partnerName: string;
  ownershipPercentage: string;
  walletBalance: string;
  expectedShare: string;
  netBalance: string;
};

export type SettlementRecalculatedEvent = {
  batchKey: string;
  referenceDate: string;
  transferCount: number;
  totalTransferAmount: string;
  totalSales: string;
  totalExpenses: string;
  profit: string;
  transfers: SettlementTransferEvent[];
  partnerPositions: SettlementPartnerPositionEvent[];
};

export type InsightGeneratedEvent = {
  insightId: string;
  type: string;
  title: string;
  description: string;
  score?: number | null;
  referenceDate?: string | null;
};

export type AlertTriggeredEvent = {
  alertId: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  referenceDate?: string | null;
};
