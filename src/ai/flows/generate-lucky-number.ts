'use server';

/**
 * @fileOverview An AI agent for generating lucky lottery numbers.
 *
 * - generateLuckyNumber - A function that suggests a lucky number for a user.
 * - LuckyNumberInput - The input type for the generateLuckyNumber function.
 * - LuckyNumberOutput - The return type for the generateLuckyNumber function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LuckyNumberInputSchema = z.object({
  userName: z.string().describe('The name of the user asking for a lucky number.'),
  gameType: z.enum(['1D', '2D', '3D', '4D']).describe("The type of lottery game, which determines the number of digits."),
});
export type LuckyNumberInput = z.infer<typeof LuckyNumberInputSchema>;

const LuckyNumberOutputSchema = z.object({
  luckyNumber: z.string().describe("The generated lucky number, as a string of digits."),
});
export type LuckyNumberOutput = z.infer<typeof LuckyNumberOutputSchema>;

export async function generateLuckyNumber(input: LuckyNumberInput): Promise<LuckyNumberOutput> {
  return generateLuckyNumberFlow(input);
}

const prompt = ai.definePrompt({
  name: 'luckyNumberPrompt',
  input: {schema: LuckyNumberInputSchema},
  output: {schema: LuckyNumberOutputSchema},
  prompt: `You are a mystical oracle that provides lucky numbers for lottery players.
A user named {{{userName}}} is playing a {{{gameType}}} game and needs a lucky number.
A {{{gameType}}} game requires a number with the same number of digits as the number in the game type (e.g., a 4D game needs a 4-digit number).
Based on their name and the nature of luck, provide a lucky number for them. Do not provide any other text, just the number string.`,
});

const generateLuckyNumberFlow = ai.defineFlow(
  {
    name: 'generateLuckyNumberFlow',
    inputSchema: LuckyNumberInputSchema,
    outputSchema: LuckyNumberOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
