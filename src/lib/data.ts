import type { LotteryGame, LotteryResult, WalletTransaction } from './types';

export const games: LotteryGame[] = [
  { id: 'single', name: 'Single Digit', description: 'Guess one number to win.', digit: 1 },
  { id: 'double', name: 'Double Digit', description: 'Guess two numbers to win.', digit: 2 },
  { id: 'three', name: 'Three Digit', description: 'Guess three numbers to win.', digit: 3 },
  { id: 'four', name: 'Four Digit', description: 'Guess four numbers to win.', digit: 4 },
];

export const dailyResults: LotteryResult[] = [
  { id: 'dr1', date: new Date().toLocaleDateString('en-CA'), gameName: 'Four Digit', winningNumber: '4826' },
  { id: 'dr2', date: new Date().toLocaleDateString('en-CA'), gameName: 'Three Digit', winningNumber: '719' },
  { id: 'dr3', date: new Date().toLocaleDateString('en-CA'), gameName: 'Double Digit', winningNumber: '35' },
  { id: 'dr4', date: new Date().toLocaleDateString('en-CA'), gameName: 'Single Digit', winningNumber: '8' },
];

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

export const weeklyResults: LotteryResult[] = [
  { id: 'wr1', date: yesterday.toLocaleDateString('en-CA'), gameName: 'Four Digit', winningNumber: '9901' },
  { id: 'wr2', date: yesterday.toLocaleDateString('en-CA'), gameName: 'Three Digit', winningNumber: '245' },
  ...dailyResults,
];

export const walletTransactions: WalletTransaction[] = [
    { id: 'wt1', date: '2024-07-21', description: 'Deposit from UPI', amount: 500, type: 'credit' },
    { id: 'wt2', date: '2024-07-20', description: 'Four Digit Ticket Purchase', amount: -20, type: 'debit' },
    { id: 'wt3', date: '2024-07-20', description: 'Winnings Credited', amount: 100, type: 'credit' },
    { id: 'wt4', date: '2024-07-19', description: 'Three Digit Ticket Purchase', amount: -10, type: 'debit' },
    { id: 'wt5', date: '2024-07-18', description: 'Withdrawal to Bank', amount: -200, type: 'debit' },
    { id: 'wt6', date: '2024-07-18', description: 'Deposit from Card', amount: 300, type: 'credit' },
]

export const user = {
    name: "Sanjay P",
    email: "sanjay@example.com",
    avatarUrl: "https://picsum.photos/seed/avatar1/40/40",
    walletBalance: 12345.67,
    bankAccount: "********1234"
}
