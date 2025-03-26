import { z } from "zod";

import { FINIX_ENVIRONMENT, SIFT_BEACON_KEY } from "@/internal/constants";

export const FinixCoreConfigSchema = z.object({
  environment: z.nativeEnum(FINIX_ENVIRONMENT),
  applicationId: z.string().uuid(),
  merchantId: z.string().uuid(),
  apiTimeout: z.number().min(100).max(30000),
  security: z.object({
    allowedOrigins: z.array(z.string().url()),
    cspNonce: z.string().optional(),
    enableHSTS: z.boolean().default(true),
    fraud: z.object({
      /** @default true */
      enableSift: z.boolean().default(true),
      /** @default SIFT_BEACON_KEY.QA_SANDBOX */
      beaconKey: z.nativeEnum(SIFT_BEACON_KEY).default(SIFT_BEACON_KEY.QA_SANDBOX),
    }),
  }),
});
