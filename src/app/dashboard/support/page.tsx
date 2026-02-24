import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="container py-6">
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Customer Support</h1>
                <p className="text-muted-foreground">We're here to help! Reach out to us with any questions or concerns.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>Get in touch with us directly.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Mail className="h-6 w-6 text-primary" />
                            <div>
                                <h3 className="font-semibold">Email</h3>
                                <a href="mailto:support@smswin.com" className="text-muted-foreground hover:text-primary">support@smswin.com</a>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <Phone className="h-6 w-6 text-primary" />
                            <div>
                                <h3 className="font-semibold">Phone</h3>
                                <p className="text-muted-foreground">+91 123 456 7890</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Send us a Message</CardTitle>
                        <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" placeholder="e.g., Issue with my wallet" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" placeholder="Describe your issue or question in detail..." />
                        </div>
                        <Button className="w-full">Send Message</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
