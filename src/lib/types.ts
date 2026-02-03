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
