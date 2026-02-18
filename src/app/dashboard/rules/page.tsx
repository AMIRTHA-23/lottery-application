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
                                    First, head over to the "Play" section. Here you'll find all the currently active lottery events. We offer a variety of game types like 1D, 2D, 3D, and 4D. Each game has its own draw date and unit price, so you can pick the one that's right for you.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>2. Select Your Number</AccordionTrigger>
                                    <AccordionContent>
                                    After selecting an event, it's time to choose your lucky number! Enter the number you want to bet on. Make sure the number of digits matches the game type (for example, a 4D game needs a 4-digit number).
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>3. Purchase Units</AccordionTrigger>
                                    <AccordionContent>
                                    Next, decide how many units of your chosen number you'd like to purchase. You can buy multiple units to increase your potential winnings. The total cost is calculated for you. Make sure you have enough funds in your wallet to cover the purchase.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger>4. Check the Results</AccordionTrigger>
                                    <AccordionContent>
                                    This is the exciting part! Once the draw date passes, go to the "Results" page to see the official winning numbers. If your number matches, you're a winner! Your winnings will be automatically added to your app wallet.
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
