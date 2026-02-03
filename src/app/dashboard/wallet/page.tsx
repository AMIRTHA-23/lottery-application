import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { user, walletTransactions } from "@/lib/data";
import { Plus, Minus } from "lucide-react";
import AnimatedCounter from "@/components/shared/animated-counter";

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>

      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Your available funds for playing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-5xl font-bold text-primary font-mono">
            ₹<AnimatedCounter value={user.walletBalance} />
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Funds
            </Button>
            <Button variant="secondary">
              <Minus className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A record of your recent deposits, withdrawals, and purchases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-semibold font-mono ${
                        tx.type === "credit" ? "text-success-light-foreground" : "text-destructive"
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
