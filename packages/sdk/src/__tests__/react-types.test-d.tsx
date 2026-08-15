import type { ComponentProps } from "react";

import {
  FinixPaymentForm,
  FinixPaymentFormHost,
  FinixPaymentFormRoot,
  type UseFinixPaymentFormOptions,
} from "../react";

type HostProps = ComponentProps<typeof FinixPaymentFormHost>;
type RootProps = ComponentProps<typeof FinixPaymentFormRoot>;
type StandaloneProps = ComponentProps<typeof FinixPaymentForm>;

const hostWithChildren: HostProps = {
  // @ts-expect-error The iframe Host must remain empty.
  children: "not allowed",
};
const hostWithInjectedHtml: HostProps = {
  // @ts-expect-error The iframe Host cannot use an HTML injection sink.
  dangerouslySetInnerHTML: { __html: "<span>not allowed</span>" },
};
const standaloneWithChildren: StandaloneProps = {
  // @ts-expect-error The standalone iframe Host must remain empty.
  children: "not allowed",
};
const invalidHookKey: UseFinixPaymentFormOptions = {
  // @ts-expect-error instanceKey is deliberately restricted to stable primitives.
  instanceKey: { checkout: 1 },
};
const invalidRootKey: Pick<RootProps, "instanceKey"> = {
  // @ts-expect-error Root exposes the same primitive remount contract.
  instanceKey: false,
};
const invalidStandaloneKey: Pick<StandaloneProps, "instanceKey"> = {
  // @ts-expect-error Standalone exposes the same primitive remount contract.
  instanceKey: Symbol("checkout"),
};

void hostWithChildren;
void hostWithInjectedHtml;
void standaloneWithChildren;
void invalidHookKey;
void invalidRootKey;
void invalidStandaloneKey;
