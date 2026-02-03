import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LotteryResult } from "@/lib/types";

interface ResultsTableProps {
  results: LotteryResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Game</TableHead>
          <TableHead className="text-right">Winning Number</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <TableRow key={result.id}>
            <TableCell>{new Date(result.date).toLocaleDateString('en-GB')}</TableCell>
            <TableCell>
              <Badge variant="secondary">{result.gameName}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <span className="font-bold text-lg font-mono tracking-widest text-primary">{result.winningNumber}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
