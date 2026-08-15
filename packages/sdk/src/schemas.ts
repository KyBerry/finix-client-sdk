import { z } from "zod";

import { FINIX_INSTRUMENT_TYPES } from "./types";

export const finixTokenDataSchema = z
  .object({
    id: z.string().regex(/^TK/, "Expected a Finix token ID beginning with TK"),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    currency: z.string().optional(),
    expires_at: z.string().optional(),
    fingerprint: z.string().regex(/^FP/, "Expected a Finix fingerprint beginning with FP").optional(),
    instrument_type: z.enum(FINIX_INSTRUMENT_TYPES).optional(),
  })
  .passthrough();

export const finixTokenResponseSchema = z
  .object({
    data: finixTokenDataSchema,
    status: z.number().optional(),
  })
  .passthrough();
