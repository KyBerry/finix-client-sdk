"use client"; // Required for useEffect and DOM interaction

import { useState, useCallback } from "react";
import { useFinixForm } from "@/hooks/useFinixForm";

export default function Page(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);

  // --- Define stable callbacks using useCallback ---
  const handleTokenize = useCallback((token: string) => {
    console.log("Token received:", token);
    setToken(token);
  }, []); // Dependency array is empty because setToken is stable

  const handleError = useCallback((error: unknown) => {
    console.error("Form error:", error);
  }, []); // Dependency array is empty as there are no external dependencies

  // Using a custom hook for better React integration
  const { formContainerRef, isLoading, formError } = useFinixForm({
    onTokenize: handleTokenize, // Pass the stable callback
    onError: handleError, // Pass the stable callback
  });

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Finix Client SDK Playground</h1>

      {token && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
          <h2 className="font-semibold">Payment Token Generated:</h2>
          <p className="font-mono text-sm bg-white p-2 mt-2 rounded">{token}</p>
        </div>
      )}

      <div className="mb-4">
        <p className="mb-2">Rendering a Card Payment Form below:</p>
        {isLoading && <p className="text-gray-500">Loading form...</p>}
        {formError && <p className="text-red-500">Error: {formError}</p>}
      </div>

      <div ref={formContainerRef} className="p-6 border border-gray-300 rounded-md shadow-sm bg-white" />
    </main>
  );
}
