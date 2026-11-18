import { z } from 'zod';

/** Upper bound for free-text echo input. Bounded input is required on every tool. */
export const PING_MESSAGE_MAX_LENGTH = 200;

export const PingInputSchema = z
  .object({
    message: z
      .string()
      .max(PING_MESSAGE_MAX_LENGTH)
      .optional()
      .describe('Optional text that the server returns unchanged.'),
  })
  .strict();

export const PingOutputSchema = z
  .object({
    status: z.literal('ok'),
    serverTime: z.iso.datetime().describe('Server clock (UTC, ISO 8601).'),
    echo: z.string().optional(),
  })
  .strict();

export const ToolSummarySchema = z
  .object({
    name: z.string(),
    title: z.string(),
    readOnly: z.boolean(),
  })
  .strict();

export const GetCapabilitiesInputSchema = z.object({}).strict();

export const CapabilitiesOutputSchema = z
  .object({
    server: z.object({ name: z.string(), version: z.string() }).strict(),
    transport: z.object({ kind: z.literal('streamable-http'), stateless: z.boolean() }).strict(),
    persistence: z.enum(['none', 'postgres']),
    authentication: z.enum(['none-local-only', 'oauth']),
    tools: z.array(ToolSummarySchema),
  })
  .strict();

export type PingInput = z.infer<typeof PingInputSchema>;
export type PingOutput = z.infer<typeof PingOutputSchema>;
export type ToolSummary = z.infer<typeof ToolSummarySchema>;
export type GetCapabilitiesInput = z.infer<typeof GetCapabilitiesInputSchema>;
export type CapabilitiesOutput = z.infer<typeof CapabilitiesOutputSchema>;
