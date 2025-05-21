// SummarizeInsights story implementation
'use server';
/**
 * @fileOverview Summarizes key insights from visualized GVA data.
 *
 * - summarizeInsights - A function that generates a summary of key trends and insights from the visualized data.
 * - SummarizeInsightsInput - The input type for the summarizeInsights function.
 * - SummarizeInsightsOutput - The return type for the summarizeInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeInsightsInputSchema = z.object({
  years: z
    .array(z.number())
    .describe('The years to include in the summary.'),
  industrialDivisions: z
    .array(z.string())
    .describe('The industrial divisions to include in the summary.'),
  data: z.string().describe('The GVA data as a stringified JSON.'),
});
export type SummarizeInsightsInput = z.infer<typeof SummarizeInsightsInputSchema>;

const SummarizeInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the key trends and insights from the visualized data.'),
});
export type SummarizeInsightsOutput = z.infer<typeof SummarizeInsightsOutputSchema>;

export async function summarizeInsights(input: SummarizeInsightsInput): Promise<SummarizeInsightsOutput> {
  return summarizeInsightsFlow(input);
}

const summarizeInsightsPrompt = ai.definePrompt({
  name: 'summarizeInsightsPrompt',
  input: {schema: SummarizeInsightsInputSchema},
  output: {schema: SummarizeInsightsOutputSchema},
  prompt: `You are an expert economic analyst.

You are provided with GVA data for various industrial divisions across a range of years. Your task is to identify and summarize the key trends and insights from this data, such as the fastest-growing sectors or significant changes in GVA over the selected period.

The data is provided as a JSON string:
{{{data}}}

The years included in the analysis are: {{{years}}}

The industrial divisions included in the analysis are: {{{industrialDivisions}}}

Provide a concise summary of the key trends and insights.`,
});

const summarizeInsightsFlow = ai.defineFlow(
  {
    name: 'summarizeInsightsFlow',
    inputSchema: SummarizeInsightsInputSchema,
    outputSchema: SummarizeInsightsOutputSchema,
  },
  async input => {
    const {output} = await summarizeInsightsPrompt(input);
    return output!;
  }
);
