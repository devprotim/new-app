export interface CashReceipt {
  cashierAccountingCashRcvTrackerID: number;
  levels: number;
  heading: string; // 'Y' or 'N'
  transactionDate: string;
  parentLevels: number;
  parentLink: string;
  parentDate: string;
  billManager: string;
  counterType: string;
  counterName: string;
  userSession: string;
  users: string;
  userSessionStatus: string;
  sysCashClosingBalance: string;
  cashRcvAmt: string;
  varience: string;
  status: string;
  Remarks: string;
  userCollectionId: number | null;
  cashierAccountingCashReceiveId: number;
  // Additional fields for UI state
  expanded?: boolean;
  visible?: boolean;
  children?: CashReceipt[];
}

export interface CashReceiptResponse {
  success: boolean;
  data: CashReceipt[];
  message?: string;
}
