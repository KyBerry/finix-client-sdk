import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { highlightCode } from "@/lib/source";

const BROWSER_SNIPPET = `import { FinixClient } from "@kyberry/finix-client-sdk";

const client = new FinixClient({ environment: "sandbox", applicationId: "AP_..." });

// 1. Put the hosted card fields inside <div id="payment-form">
const form = await client.mount("payment-form", { paymentMethods: ["card"] });

// 2. When the user clicks your button, turn what they typed into a token
const { token } = await form.submit();

// 3. Send the token to your server; it never sees the card number
await fetch("/api/payment-instruments", { method: "POST", body: JSON.stringify({ token }) });`;

const REACT_SNIPPET = `"use client";
import { FinixPaymentForm, useFinixClient } from "@kyberry/finix-client-sdk/react";

export function PaymentForm() {
  const client = useFinixClient({ environment: "sandbox", applicationId: "AP_..." });

  return (
    <FinixPaymentForm client={client} options={{ paymentMethods: ["card"] }}>
      {(form) => (
        <button disabled={!form.canSubmit} onClick={() => form.submit().then(({ token }) => save(token))}>
          Save card
        </button>
      )}
    </FinixPaymentForm>
  );
}`;

export default async function LandingPage() {
  const [browserHtml, reactHtml, installHtml] = await Promise.all([
    highlightCode(BROWSER_SNIPPET, "ts"),
    highlightCode(REACT_SNIPPET, "tsx"),
    highlightCode("pnpm add @kyberry/finix-client-sdk", "bash"),
  ]);
  const codeClass =
    "prose-doc overflow-x-auto rounded-lg border border-border [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:leading-relaxed";

  return (
    <main className="mx-auto max-w-[68ch] px-4 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Take card payments without touching card numbers</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        A small, typed wrapper around Finix&apos;s hosted payment form. Finix renders the card fields inside an
        iframe on your page; you get a token to send to your server. This package handles loading, mounting,
        submitting, errors, and React, so you write a few lines instead of a few hundred.
      </p>
      <div className={`${codeClass} mt-8`} dangerouslySetInnerHTML={{ __html: installHtml }} />
      <Tabs defaultSelectedKey="react" className="mt-6">
        <TabsList variant="line">
          <TabsTrigger id="react">React</TabsTrigger>
          <TabsTrigger id="browser">Plain JavaScript</TabsTrigger>
        </TabsList>
        <TabsContent id="react" className="pt-3">
          <div className={codeClass} dangerouslySetInnerHTML={{ __html: reactHtml }} />
        </TabsContent>
        <TabsContent id="browser" className="pt-3">
          <div className={codeClass} dangerouslySetInnerHTML={{ __html: browserHtml }} />
        </TabsContent>
      </Tabs>
      <ul className="mt-10 flex flex-col gap-2 text-sm">
        <li><Link href="/docs/getting-started/installation" className="text-accent-link hover:underline">Start here: install and mount your first form</Link></li>
        <li><Link href="/docs/examples/basic-card" className="text-accent-link hover:underline">Try the live examples</Link></li>
        <li><Link href="/docs/reference/client" className="text-accent-link hover:underline">API reference</Link></li>
      </ul>
      <p className="mt-10 text-sm text-muted-foreground">
        Independent, unofficial package. Not maintained, endorsed, or certified by Finix.
      </p>
    </main>
  );
}
