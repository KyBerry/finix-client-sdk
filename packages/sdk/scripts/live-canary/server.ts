import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 4177;
// eslint-disable-next-line turbo/no-undeclared-env-vars -- This opt-in canary reads a repository variable outside normal Turbo tasks.
const applicationId = process.env.FINIX_SANDBOX_APPLICATION_ID?.trim();

if (!applicationId) {
  throw new Error("FINIX_SANDBOX_APPLICATION_ID is required to run the live Finix CDN canary.");
}

function serializeForInlineScript(value: string): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

const pageMarkup = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Finix v2 live contract canary</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; min-width: 0; }
      body { padding: 16px; font-family: system-ui, sans-serif; }
      main { width: min(100%, 42rem); margin-inline: auto; min-width: 0; }
      #finix-payment-form { width: 100%; min-width: 0; overflow: hidden; }
      #finix-payment-form > iframe { display: block; width: 100%; max-width: 100%; border: 0; }
    </style>
    <script data-finix-v2-script src="https://js.finix.com/v/2/finix.js"></script>
  </head>
  <body>
    <main>
      <h1>Finix v2 live contract canary</h1>
      <div id="finix-payment-form"></div>
    </main>
    <script>
      const root = document.documentElement;
      let onLoadCount = 0;
      let onUpdateCount = 0;

      const markError = (error) => {
        root.dataset.finixError = error instanceof Error ? error.message : String(error);
      };

      window.addEventListener("error", (event) => markError(event.error ?? event.message));
      window.addEventListener("unhandledrejection", (event) => markError(event.reason));

      try {
        const form = window.Finix.PaymentForm(
          "finix-payment-form",
          "sandbox",
          ${serializeForInlineScript(applicationId)},
          {
            paymentMethods: ["card"],
            showAddress: false,
            showLabels: true,
            labels: {
              card_holder_name: "Canary cardholder name",
              number: "Canary card number",
              expiration_date: "Canary expiration",
              security_code: "Canary security code"
            },
            enableDarkMode: true,
            styles: {
              default: {
                input: {
                  default: {
                    backgroundColor: "#eaf2ff",
                    border: "3px solid #245ea8",
                    color: "#102a43"
                  },
                  focused: {
                    border: "4px solid #d12c7a",
                    boxShadow: "0 0 0 2px #ffd1e6"
                  }
                }
              },
              dark: {
                input: {
                  default: {
                    backgroundColor: "#14213d",
                    border: "3px solid #4fd1c5",
                    color: "#f7fafc"
                  },
                  focused: {
                    border: "4px solid #f6ad55",
                    boxShadow: "0 0 0 2px #7b341e"
                  }
                }
              }
            },
            onLoad: () => {
              onLoadCount += 1;
              root.dataset.finixOnLoadCount = String(onLoadCount);
            },
            onUpdate: (state, binInformation, hasErrors) => {
              onUpdateCount += 1;
              root.dataset.finixOnUpdateCount = String(onUpdateCount);
              root.dataset.finixStateType = state !== null && typeof state === "object" && !Array.isArray(state)
                ? "object"
                : "invalid";
              root.dataset.finixBinType = binInformation !== null && typeof binInformation === "object" && !Array.isArray(binInformation)
                ? "object"
                : "invalid";
              root.dataset.finixHasErrorsType = typeof hasErrors;
            }
          }
        );

        if (form === undefined || typeof form.submit !== "function") {
          throw new Error("Finix.PaymentForm did not return the documented Form Instance boundary.");
        }
        root.dataset.finixInstance = "created";
      } catch (error) {
        markError(error);
      }
    </script>
  </body>
</html>`;

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);

  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (requestUrl.pathname === "/health") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("ok");
    return;
  }

  if (requestUrl.pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(pageMarkup);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("not found");
});

server.listen(port, host, () => {
  process.stdout.write(`Finix live canary server listening on http://${host}:${port}\n`);
});

function shutDown(): void {
  server.close((error) => {
    if (error) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
