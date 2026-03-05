import type { LucideIcon } from "lucide-react";

export interface LotteryGame {
  id: string;
  name: string;
  description: string;
  digit: number;
}

export interface LotteryResult {
  id: string;
  date: string;
  gameName: string;
  winningNumber: string;
}

export interface WalletTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

export interface LiveDraw extends LotteryEvent {
  image: string;
  imageHint: string;
}

export interface AdminStat {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: LucideIcon;
}

export interface SalesChartData {
  name: string;
  sales: number;
  payouts: number;
}

export interface GamePopularity {
    id: string;
    name: string;
    type: string;
    units: string;
    progress: number;
    color: string;
}

export interface Wallet {
  id:string;
  userId: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  transactionDate: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | 'Purchase' | 'Payout';
  description: string;
  lotteryEventId?: string;
}

export interface LotteryNumber {
  id: string;
  userId: string;
  lotteryEventId: string;
  eventName?: string;
  number: string;
  purchaseDate: string;
  unitPrice: number;
  unitsPurchased: number;
  board?: 'A' | 'B' | 'C' | 'AB' | 'BC' | 'AC' | 'ABC' | 'XABC';
  agency?: 'Kerala' | 'Dear' | 'Jackpot';
  amount?: number;
}

export interface LotteryEvent {
  id: string;
  name: string;
  eventDate: string;
  result: string;
  status: 'Open' | 'Closed' | 'Completed';
  isEnabled: boolean;
  gameType: '1D' | '2D' | '3D' | '4D' | 'LuckyDraw';
  unitPrice: number;
  prize?: string;
  agency?: 'Kerala' | 'Dear' | 'Jackpot';
}

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  referralSource: string;
  registrationDate: string;
  isAgeVerified: boolean;
  kycStatus: 'Pending' | 'Verified' | 'Rejected';
  status?: 'Active' | 'Frozen';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  prize1D: number;
  prize2D: number;
  prize3D: number;
  prize4D: number;
}

export interface CartItem {
  id: string;
  eventName: string;
  eventId: string;
  agency: 'Kerala' | 'Dear' | 'Jackpot';
  board: string;
  number: string;
  unit: number;
  price: number;
  amount: number;
  eventDate: string;
}
