import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { user } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Banknote, Info } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name and email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={user.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user.email} />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Banknote /> Bank Account</CardTitle>
            <CardDescription>Your bank account for withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="space-y-2">
                <Label>Account Number</Label>
                <Input readOnly value={user.bankAccount} />
            </div>
            <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                To change your bank account number, please contact admin support. Changes will be reflected within 15-30 minutes after confirmation.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
