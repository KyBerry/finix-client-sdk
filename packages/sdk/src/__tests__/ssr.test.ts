// @vitest-environment node

import { describe, expect, it } from "vitest";

import { createFinixAuth, FinixClient, loadFinix } from "../index";
import { FinixPaymentForm, useFinixPaymentForm } from "../react";

describe("server-side import safety", () => {
  it("imports core and React entry points without accessing browser globals", () => {
    expect(typeof FinixClient).toBe("function");
    expect(typeof FinixPaymentForm).toBe("object");
    expect(typeof useFinixPaymentForm).toBe("function");
  });

  it("fails browser-only operations with a stable SDK error", async () => {
    const client = new FinixClient({
      environment: "sandbox",
      applicationId: "AP_test_application",
    });

    await expect(loadFinix()).rejects.toMatchObject({ code: "not_browser" });
    await expect(client.mount("payment-form")).rejects.toMatchObject({ code: "not_browser" });
    await expect(
      createFinixAuth({ environment: "sandbox", merchantId: "MU_test_merchant" }),
    ).rejects.toMatchObject({ code: "not_browser" });
  });
});
