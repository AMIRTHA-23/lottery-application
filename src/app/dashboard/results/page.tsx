import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultsTable } from "@/components/lottery/results-table";
import { dailyResults, weeklyResults } from "@/lib/data";

export default function ResultsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Lottery Results</h1>
      <Card>
        <CardHeader>
          <CardTitle>View Results</CardTitle>
          <CardDescription>Check the winning numbers for daily and weekly draws.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily Results</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Results</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <ResultsTable results={dailyResults} />
            </TabsContent>
            <TabsContent value="weekly">
              <ResultsTable results={weeklyResults} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
