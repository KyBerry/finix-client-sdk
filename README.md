# Finix Client SDK

[![npm version](https://img.shields.io/npm/v/@kyberry/finix-client-sdk.svg)](https://www.npmjs.com/package/@kyberry/finix-client-sdk)
[![license](https://img.shields.io/npm/l/@kyberry/finix-client-sdk.svg)](https://github.com/KyBerry/finix-client-sdk/blob/ee64724b13eb6cc6173c23652e7349a413f89adf/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)](https://nextjs.org/)

A modern, developer-friendly SDK for integrating with Finix payment processing services. This unofficial client library significantly improves developer experience while maintaining full compatibility with Finix's payment API.

## Features

- 🌐 **Cross-Framework Compatibility**: Works with vanilla JavaScript, TypeScript, React, and Next.js
- 📱 **Responsive Design**: Forms automatically adjust to different screen sizes
- 🔒 **PCI Compliant**: Sensitive payment data never touches your servers
- 🧩 **Modular Architecture**: Import only what you need
- 📦 **Modern Packaging**: ESM and CommonJS support
- 🛠️ **Customizable**: Extensive styling and layout options
- 🔄 **Promise-Based API**: For clean, modern async code
- 🌐 **SSR Support**: Works seamlessly with Next.js App Router
- 📝 **TypeScript-First**: Full type definitions and type safety
- 🎨 **Theming**: Easily match your brand's visual identity

## Installation

```bash
# npm
npm install @kyberry/finix-client-sdk

# yarn
yarn add @kyberry/finix-client-sdk

# pnpm
pnpm add @kyberry/finix-client-sdk
```

## Quick Start

### JavaScript

```javascript
import { Finix } from "@kyberry/finix-client-sdk";

// Initialize the SDK
const finix = new Finix({
  environment: "sandbox",
  applicationId: "YOUR_APPLICATION_ID",
});

// Mount a card form
const cardForm = finix.mountCardForm("payment-form", {
  styles: {
    default: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSize: "16px",
    },
  },
  onUpdate: (state) => {
    console.log("Form state updated:", state);
  },
});

// Submit the form when the user clicks a button
document.getElementById("submit-button").addEventListener("click", async () => {
  try {
    const token = await cardForm.submit();
    console.log("Payment token created:", token);

    // Send token to your server for processing
  } catch (error) {
    console.error("Error creating payment token:", error);
  }
});
```

### TypeScript

```typescript
import { Finix, FinixConfig, CardFormOptions, TokenResponse, FinixError } from "@kyberry/finix-client-sdk";

// Configuration with TypeScript support
const config: FinixConfig = {
  environment: "sandbox",
  applicationId: "YOUR_APPLICATION_ID",
};

// Initialize the SDK
const finix = new Finix(config);

// Form options with TypeScript support
const formOptions: CardFormOptions = {
  styles: {
    default: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSize: "16px",
    },
    focus: {
      color: "#32325d",
      borderColor: "#3D95CE",
    },
  },
  showAddress: true,
  requiredFields: ["name"],
};

// Mount and use the form
const cardForm = finix.mountCardForm("payment-form", formOptions);

// Handle submission with TypeScript
async function handleSubmit(): Promise<void> {
  try {
    const token: TokenResponse = await cardForm.submit();
    console.log("Token created:", token.token);

    // Process the token
  } catch (error) {
    // TypeScript will correctly infer the error type
    const finixError = error as FinixError;
    console.error(`Error ${finixError.code}: ${finixError.message}`);
  }
}

// Add event listener
document.getElementById("submit-button")?.addEventListener("click", handleSubmit);
```

### React

```tsx
import React, { useState } from "react";
import { Finix, FinixProvider, CardElement, TokenResponse, FinixError } from "@kyberry/finix-client-sdk/react";

// Initialize at the app level
const App: React.FC = () => {
  const finix = new Finix({
    environment: "sandbox",
    applicationId: "YOUR_APPLICATION_ID",
  });

  return (
    <FinixProvider finix={finix}>
      <PaymentForm />
    </FinixProvider>
  );
};

// Payment form component with TypeScript
const PaymentForm: React.FC = () => {
  const [status, setStatus] = useState<string>("");

  const handleSuccess = (token: TokenResponse) => {
    setStatus("Payment successful!");
    console.log("Token:", token.token);

    // Send token to your backend for processing
  };

  const handleError = (error: FinixError) => {
    setStatus(`Payment failed: ${error.message}`);
  };

  return (
    <div>
      <h2>Enter Payment Details</h2>
      <CardElement
        onSuccess={handleSuccess}
        onError={handleError}
        options={{
          showAddress: true,
          styles: {
            default: {
              color: "#32325d",
              fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            },
          },
        }}
      />
      {status && <div className="status">{status}</div>}
    </div>
  );
};

export default App;
```

### Next.js (App Router)

#### Root Layout with Provider Setup

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { FinixProvider } from "@kyberry/finix-client-sdk/next";
import { createFinixClient } from "@/lib/finix-client";

export const metadata: Metadata = {
  title: "My Payment App",
  description: "Secure payment processing with Finix",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Create the Finix client
  const finixClient = createFinixClient();

  return (
    <html lang="en">
      <body>
        <FinixProvider finix={finixClient}>{children}</FinixProvider>
      </body>
    </html>
  );
}
```

#### Client-Side Module

```tsx
// lib/finix-client.ts
"use client";

import { FinixSSR } from "@kyberry/finix-client-sdk/next";

// Create a client-side only Finix instance
export function createFinixClient() {
  return new FinixSSR({
    environment: process.env.NEXT_PUBLIC_FINIX_ENVIRONMENT || "sandbox",
    applicationId: process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID,
  });
}
```

#### Payment Page

```tsx
// app/checkout/page.tsx
"use client";

import { useState } from "react";
import { FinixPaymentForm, TokenResponse, FinixError } from "@kyberry/finix-client-sdk/next";

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSuccess = (token: TokenResponse) => {
    setPaymentStatus("Payment processed successfully!");
    setPaymentError(null);

    // In a real app, you would call your API route to process the payment
    // fetch('/api/process-payment', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token: token.token })
    // });
  };

  const handleError = (error: FinixError) => {
    setPaymentStatus(null);
    setPaymentError(`Payment failed: ${error.message}`);
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Complete Your Purchase</h1>

      <div className="max-w-xl">
        <FinixPaymentForm
          type="card"
          options={{
            showAddress: true,
            styles: {
              default: {
                color: "#32325d",
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
              },
            },
          }}
          onSuccess={handleSuccess}
          onError={handleError}
          showSubmitButton={true}
          submitButtonText="Pay Now"
        />

        {paymentStatus && <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">{paymentStatus}</div>}

        {paymentError && <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">{paymentError}</div>}
      </div>
    </main>
  );
}
```

#### API Route for Processing Payments

```tsx
// app/api/process-payment/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Payment token is required" }, { status: 400 });
    }

    // Here you would use your server-side API to process the payment
    // using the token with Finix's API

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Payment processing error:", error);

    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}
```

### Custom Form Layout

For complete control over your form's appearance:

```typescript
const cardForm = finix.mountCardForm("payment-form", {
  fields: {
    // Target specific elements for each field
    name: {
      selector: "#card-holder-name",
      placeholder: "Jane Doe",
    },
    number: {
      selector: "#card-number",
      placeholder: "4111 1111 1111 1111",
    },
    expiration_date: {
      selector: "#card-expiry",
      placeholder: "MM/YYYY",
    },
    security_code: {
      selector: "#card-cvc",
      placeholder: "CVC",
    },
  },
  styles: {
    default: {
      color: "#32325d",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "16px",
      padding: "10px 14px",
    },
  },
});
```

With this HTML structure:

```html
<form id="payment-form">
  <div class="form-row">
    <label for="card-holder-name">Cardholder Name</label>
    <div id="card-holder-name" class="field-container"></div>
  </div>

  <div class="form-row">
    <label for="card-number">Card Number</label>
    <div id="card-number" class="field-container"></div>
  </div>

  <div class="form-row half-width">
    <label for="card-expiry">Expiration Date</label>
    <div id="card-expiry" class="field-container"></div>
  </div>

  <div class="form-row half-width">
    <label for="card-cvc">CVC</label>
    <div id="card-cvc" class="field-container"></div>
  </div>

  <button type="submit">Pay Now</button>
</form>
```

## React Hooks

For more flexibility in React applications, you can use the `useFinixForm` hook:

```tsx
import { useFinix, useFinixForm } from "@kyberry/finix-client-sdk/react";

function CustomPaymentForm() {
  const { submit, isValid, isSubmitting, formState, error } = useFinixForm({
    type: "card",
    elementId: "custom-payment-container",
    options: {
      showAddress: true,
      styles: {
        default: {
          color: "#32325d",
        },
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || isSubmitting) return;

    try {
      const token = await submit();
      console.log("Token created:", token);
      // Process payment...
    } catch (err) {
      console.error("Payment failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div id="custom-payment-container" />

      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Processing..." : "Pay Now"}
      </button>

      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

## Error Handling

The SDK provides structured error objects for better error handling:

```typescript
try {
  const token = await cardForm.submit();
  // Handle successful token creation
} catch (error) {
  if (error instanceof FinixError) {
    console.error(`Error (${error.code}): ${error.message}`);

    // Handle specific error codes
    switch (error.code) {
      case "VALIDATION_ERROR":
        // Handle validation errors
        break;
      case "TOKENIZATION_FAILED":
        // Handle tokenization failures
        break;
      case "NETWORK_ERROR":
        // Handle network issues
        break;
      default:
        // Handle other errors
        break;
    }
  } else {
    // Handle unexpected errors
    console.error("Unexpected error:", error);
  }
}
```

## Internationalization

The SDK supports international payment methods and addresses:

```typescript
const bankForm = finix.mountBankAccountForm("bank-form", {
  defaultValues: {
    address_country: "CA", // Default to Canada
  },
  labels: {
    transit_number: "Transit Number",
    institution_number: "Institution Number",
  },
  // Canadian-specific fields will be shown automatically
});
```

## Testing

To help with development and testing, the SDK provides test card numbers:

```plaintext
# Test Card Numbers
4111 1111 1111 1111 - Visa (success)
4000 0000 0000 0002 - Visa (declined)
5555 5555 5555 4444 - Mastercard (success)
3782 8224 6310 005 - American Express (success)

# Test Bank Account
Routing Number: 021000021
Account Number: 9876543210
```

## Documentation

For complete documentation and examples, visit our [GitHub repository](https://github.com/KyBerry/finix-client-sdk/tree/main/docs).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/KyBerry/finix-client-sdk/blob/ee64724b13eb6cc6173c23652e7349a413f89adf/LICENSE) file for details.

## Disclaimer

This is an unofficial SDK for integrating with Finix payment services. It is not affiliated with, endorsed by, or connected to Finix Payments in any way. "Finix" and related trademarks are the property of their respective owners. This project aims to provide developers with an improved interface for working with Finix payment services, but makes no guarantees about compatibility or continued functionality as Finix APIs may change without notice.
