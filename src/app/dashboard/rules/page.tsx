import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function RulesPage() {
    return (
        <div className="container py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Game Rules & Info</h1>
                <p className="text-muted-foreground">Understand how to play and our commitment to responsible gaming.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>How to Play</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>1. Choose a Game</AccordionTrigger>
                                    <AccordionContent>
                                    Navigate to the "Play" section and select an active lottery event. We offer various game types like 1D, 2D, 3D, and 4D. Each event has a specific draw date and unit price.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>2. Select Your Number</AccordionTrigger>
                                    <AccordionContent>
                                    Once you've selected an event, enter the number you wish to play. The number of digits must match the game type (e.g., a 4D game requires a 4-digit number).
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>3. Purchase Units</AccordionTrigger>
                                    <AccordionContent>
                                    Decide how many units of your chosen number you want to buy. The total cost will be calculated automatically based on the event's unit price. Ensure you have sufficient funds in your wallet.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger>4. Check the Results</AccordionTrigger>
                                    <AccordionContent>
                                    After the draw date, visit the "Results" page to see the winning numbers. If your number matches, your winnings will be automatically credited to your wallet!
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Responsible Gaming</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>We are committed to responsible gaming and providing a safe and enjoyable experience for all our users.</p>
                            <p>Remember to play responsibly. Do not chase losses, and only play with money you can afford to lose. Set limits for yourself and take breaks.</p>
                             <p>If you feel you might have a gambling problem, please seek help from a professional organization.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Fair Play</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>All lottery draws are conducted with the utmost fairness and transparency. Winning numbers are generated through a secure and audited process to ensure integrity.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    