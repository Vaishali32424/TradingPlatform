export type UserRole = "superadmin" | "broker" | "user";

export interface AuthUser {
  id: string;
  loginId: string;
  role: UserRole;
  name: string;
  brokerId?: string;
}

export interface Broker {
  _id: string;
  brokerId: string;
  name: string;
  relation?: string;
  remark?: string;
  email?: string;
  bankAccountNumber: string;
  phone: string;
  address: string;
  ifscCode: string;
  aadharNumber?: string;
  panNumber?: string;
  totalReceived: number;
  isActive: boolean;
  userCount?: number;
  users?: PlatformUser[];
  profilePhoto?: string;
  passwordPlain?: string;
}

export interface PlatformUser {
  _id: string;
  userId: string;
  brokerId: string;
  name: string;
  phone?: string;
  email?: string;
  aadharNumber?: string;
  panNumber?: string;
  totalDeposited: number;
  isActive: boolean;
  profilePhoto?: string;
  dematNumber?: string;
  approvalStatus?: "pending" | "approved" | "declined";
  openPL?: number;
  realizedPL?: number;
  walletBalance?: number;
  aadharMasked?: string;
  panMasked?: string;
  passwordPlain?: string;
}

export type OptionType = "call" | "put";
export type TradeSide = "buy" | "sell";
export type TradeCurrency = "INR" | "USD";

export interface Trade {
  _id: string;
  tradeName?: string;
  companyName?: string;
  expiryDate?: string;
  strikePrice?: number;
  optionType?: OptionType;
  lots?: number;
  side?: TradeSide;
  buyAmount?: number;
  sellAmount?: number;
  plMultiplier?: number;
  amount: number;
  profitLoss?: number;
  currency?: TradeCurrency;
  status: string;
  userId: string;
  brokerId?: string;
  userName?: string;
  brokerName?: string;
  userProfilePhoto?: string;
  brokerProfilePhoto?: string;
  notes?: string;
  createdAt: string;
  inOrderHistory?: boolean;
  scheduledMoveAt?: string;
  movedToHistoryAt?: string;
}

export type StatementLedgerRow = {
  date: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
  type?: string;
};

export interface ActivityTradeMeta {
  companyName: string;
  expiryDate: string;
  strikePrice: number;
  optionType: string;
  lots: number;
  side: string;
  amount: number;
  currency: string;
}

export interface ActivityMetadata {
  brokerId?: string;
  brokerName?: string;
  userId?: string;
  userName?: string;
  amount?: number;
  trade?: ActivityTradeMeta;
  note?: string;
}

export interface BrokerActivity {
  action: string;
  actorId: string;
  brokerName?: string;
  brokerDisplayId?: string;
  userId?: string;
  userName?: string;
  details?: string;
  metadata?: ActivityMetadata;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  amount: number;
  status: string;
  type?: string;
  createdAt: string;
  note?: string;
  addedByBrokerName?: string;
}

export type WithdrawalStatus = "pending" | "approved" | "declined" | "on_hold";

export interface WithdrawalRequest {
  _id: string;
  userId: string;
  userName: string;
  brokerId: string;
  amount: number;
  status: WithdrawalStatus;
  userNote?: string;
  brokerRemark?: string;
  reviewedAt?: string;
  createdAt: string;
}
