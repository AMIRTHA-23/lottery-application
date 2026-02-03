'use server';

/**
 * @fileOverview A real-time winner notification AI agent.
 *
 * - generateWinningNotification - A function that generates a personalized notification for potential lottery winners.
 * - WinningNotificationInput - The input type for the generateWinningNotification function.
 * - WinningNotificationOutput - The return type for the generateWinningNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WinningNotificationInputSchema = z.object({
  userLotteryNumbers: z.array(z.string()).describe('An array of lottery numbers the user has purchased in the past.'),
  winningNumbers: z.array(z.string()).describe('An array of the winning lottery numbers from the latest drawing.'),
  userName: z.string().describe('The name of the user.'),
});
export type WinningNotificationInput = z.infer<typeof WinningNotificationInputSchema>;

const WinningNotificationOutputSchema = z.object({
  notificationMessage: z.string().describe('A personalized notification message informing the user of any potential winning numbers.'),
});
export type WinningNotificationOutput = z.infer<typeof WinningNotificationOutputSchema>;

export async function generateWinningNotification(input: WinningNotificationInput): Promise<WinningNotificationOutput> {
  return generateWinningNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'winningNotificationPrompt',
  input: {schema: WinningNotificationInputSchema},
  output: {schema: WinningNotificationOutputSchema},
  prompt: `You are a lottery notification system that sends personalized messages to users who may have winning numbers.

  Based on the user's purchased lottery numbers and the latest winning numbers, generate a notification message.
  The notification message should congratulate the user if there are any matches and inform them of the potential winnings.
  Make sure to personalize the message for the user.

  User Name: {{{userName}}}
  User Lottery Numbers: {{#each userLotteryNumbers}}{{{this}}} {{/each}}
  Winning Numbers: {{#each winningNumbers}}{{{this}}} {{/each}}

  Notification Message:`, // Removed unneeded Handlebars if/else
});

const generateWinningNotificationFlow = ai.defineFlow(
  {
    name: 'generateWinningNotificationFlow',
    inputSchema: WinningNotificationInputSchema,
    outputSchema: WinningNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
