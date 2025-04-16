import { BaseFormCreator } from "./base-form-creator";
import { BankPaymentForm } from "@/products/bank-payment-form";

import type { PaymentForm, FormOptions } from "@/interfaces/types";

/**
 * Concrete creator for bank payment forms
 */
export class BankFormCreator extends BaseFormCreator<"bank"> {
  /**
   * Create a bank payment form
   */
  createForm(options: FormOptions<"bank">): PaymentForm {
    return new BankPaymentForm();
  }
}
