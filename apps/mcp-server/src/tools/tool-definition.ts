import type { ToolSummary } from '@ai-workspace/contracts';
import type { CallToolResult, McpServer, ToolAnnotations } from '@modelcontextprotocol/server';
import type { z } from 'zod';

import type { Logger } from '../logger.js';

type ObjectSchema = z.ZodObject<z.ZodRawShape, z.core.$ZodObjectConfig>;

/** Transport-neutral description of one tool. The handler holds no MCP types. */
export interface ToolSpec<I extends ObjectSchema, O extends ObjectSchema> {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: I;
  readonly outputSchema: O;
  readonly annotations: ToolAnnotations & { readonly readOnlyHint: boolean };
  readonly handler: (input: z.output<I>) => z.output<O> | Promise<z.output<O>>;
}

/** A tool after type erasure, so that tools with different schemas share one list. */
export interface ToolRegistration {
  readonly summary: ToolSummary;
  register(server: McpServer, logger: Logger): void;
}

/** Annotations for tools that only read and never change state. */
export const READ_ONLY_ANNOTATIONS = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

export const INTERNAL_ERROR_TEXT = 'The tool failed because of an internal error.';

export function defineTool<I extends ObjectSchema, O extends ObjectSchema>(
  spec: ToolSpec<I, O>,
): ToolRegistration {
  return Object.freeze({
    summary: Object.freeze({
      name: spec.name,
      title: spec.title,
      readOnly: spec.annotations.readOnlyHint,
    }),
    register: (server: McpServer, logger: Logger) => {
      // Widen to the base schema type (safe assignment, not a cast) so that the
      // SDK's conditional callback type resolves; runTool re-validates the input.
      const inputSchema: ObjectSchema = spec.inputSchema;
      const outputSchema: ObjectSchema = spec.outputSchema;
      server.registerTool(
        spec.name,
        {
          title: spec.title,
          description: spec.description,
          inputSchema,
          outputSchema,
          annotations: spec.annotations,
        },
        (args: unknown) => runTool(spec, args, logger),
      );
    },
  });
}

export const INVALID_INPUT_TEXT = 'The tool input is not valid.';

/**
 * Validates input with the tool's own schema, runs the handler, and maps
 * unexpected failures to a sanitized error result (no internal details leak).
 */
export async function runTool<I extends ObjectSchema, O extends ObjectSchema>(
  spec: ToolSpec<I, O>,
  args: unknown,
  logger: Logger,
): Promise<CallToolResult> {
  const parsed = spec.inputSchema.safeParse(args);
  if (!parsed.success) {
    return { isError: true, content: [{ type: 'text', text: INVALID_INPUT_TEXT }] };
  }
  try {
    const output = await spec.handler(parsed.data);
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    };
  } catch (error: unknown) {
    logger.error('tool_failed', {
      tool: spec.name,
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return { isError: true, content: [{ type: 'text', text: INTERNAL_ERROR_TEXT }] };
  }
}
