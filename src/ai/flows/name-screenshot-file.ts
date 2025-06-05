'use server';

/**
 * @fileOverview Generates a descriptive filename for a screenshot based on the email content.
 *
 * - nameScreenshotFile - A function that generates a descriptive filename for a screenshot based on the email content.
 * - NameScreenshotFileInput - The input type for the nameScreenshotFile function.
 * - NameScreenshotFileOutput - The return type for the nameScreenshotFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NameScreenshotFileInputSchema = z.object({
  emailContent: z
    .string()
    .describe('The full content of the email to generate a filename from.'),
});
export type NameScreenshotFileInput = z.infer<typeof NameScreenshotFileInputSchema>;

const NameScreenshotFileOutputSchema = z.object({
  filename: z
    .string()
    .describe(
      'A descriptive filename generated from the email content, without the file extension.'
    ),
});
export type NameScreenshotFileOutput = z.infer<typeof NameScreenshotFileOutputSchema>;

export async function nameScreenshotFile(input: NameScreenshotFileInput): Promise<NameScreenshotFileOutput> {
  return nameScreenshotFileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'nameScreenshotFilePrompt',
  input: {schema: NameScreenshotFileInputSchema},
  output: {schema: NameScreenshotFileOutputSchema},
  prompt: `You are an expert in naming files descriptively and concisely.

  Given the content of an email, generate a filename that summarizes the email's content.
  The filename should be short, descriptive, and suitable for use in a file system.
  Do not include the file extension in the filename.

  Email Content: {{{emailContent}}}`,
});

const nameScreenshotFileFlow = ai.defineFlow(
  {
    name: 'nameScreenshotFileFlow',
    inputSchema: NameScreenshotFileInputSchema,
    outputSchema: NameScreenshotFileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
