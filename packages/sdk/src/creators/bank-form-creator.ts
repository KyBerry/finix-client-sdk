import { BaseFormCreator } from "./base-form-creator";
import { BankPaymentForm } from "@/products/bank-payment-form";

import type { FormConfig } from "@/types";

/**
 * Concrete creator for bank payment forms
 */
export class BankFormCreator extends BaseFormCreator<"bank"> {
  /**
   * Create a bank payment form
   */
  createForm(formConfig: FormConfig<"bank">) {
    return new BankPaymentForm();
  }
}
