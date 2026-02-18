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

export interface LiveDraw {
  id: string;
  title: string;
  drawDate: string;
  prize: string;
  image: string;
  imageHint: string;
  countdown: string | null;
  isHot: boolean;
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
  walletId: string;
  transactionDate: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | 'Purchase' | 'Payout';
  description: string;
}

export interface LotteryNumber {
  id: string;
  userId: string;
  lotteryEventId: string;
  number: string;
  purchaseDate: string;
  unitPrice: number;
  unitsPurchased: number;
}

export interface LotteryEvent {
  id: string;
  name: string;
  eventDate: string;
  result: string;
  status: 'Open' | 'Closed' | 'Completed';
  isEnabled: boolean;
  gameType: '1D' | '2D' | '3D' | '4D';
  unitPrice: number;
}

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  registrationDate: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

    