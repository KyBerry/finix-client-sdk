export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    title: "Getting started",
    items: [
      { title: "Installation", href: "/docs/getting-started/installation" },
      { title: "Quick start", href: "/docs/getting-started/quick-start" },
      { title: "Tokenization flow", href: "/docs/getting-started/tokenization-flow" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Appearance & theming", href: "/docs/guides/appearance" },
      { title: "React primitives", href: "/docs/guides/react" },
      { title: "Errors, timeouts & abort", href: "/docs/guides/errors-timeouts-abort" },
      { title: "Auth sessions", href: "/docs/guides/auth" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "FinixClient", href: "/docs/reference/client" },
      { title: "PaymentFormInstance", href: "/docs/reference/payment-form" },
      { title: "loadFinix", href: "/docs/reference/loader" },
      { title: "Appearance helpers", href: "/docs/reference/appearance" },
      { title: "React", href: "/docs/reference/react" },
      { title: "Auth", href: "/docs/reference/auth" },
      { title: "Error codes", href: "/docs/reference/errors" },
      { title: "Types & constants", href: "/docs/reference/types" },
    ],
  },
  {
    title: "Examples",
    items: [
      { title: "Basic card form", href: "/docs/examples/basic-card" },
      { title: "Themed appearance", href: "/docs/examples/themed-appearance" },
      { title: "React headless", href: "/docs/examples/react-headless" },
      { title: "Payment methods & address", href: "/docs/examples/form-options" },
    ],
  },
];

export function flattenNavigation(): NavItem[] {
  return NAVIGATION.flatMap((section) => section.items);
}

export function findNavNeighbors(pathname: string): { previous?: NavItem; next?: NavItem } {
  const items = flattenNavigation();
  const index = items.findIndex((item) => item.href === pathname);
  if (index === -1) {
    return {};
  }
  return { previous: items[index - 1], next: items[index + 1] };
}
