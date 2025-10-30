// src/lib/stripe-config.ts
// This file contains client-safe Stripe configuration (no API keys)

// Pricing configuration - define your credit packages here
export const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter Package",
    credits: 50,
    price: 2900, // $29.00 in cents
    description: "Perfect for small teams (up to 5 members)",
    popular: false,
  },
  {
    id: "professional",
    name: "Professional Package",
    credits: 150,
    price: 7900, // $79.00 in cents
    description: "Ideal for growing teams (up to 15 members)",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise Package",
    credits: 500,
    price: 19900, // $199.00 in cents
    description: "For large organizations (50+ members)",
    popular: false,
  },
  {
    id: "custom",
    name: "Custom Package",
    credits: 0, // Will be calculated based on user input
    pricePerCredit: 50, // $0.50 per credit in cents
    description: "Build your own package",
    popular: false,
  },
] as const;

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];

// Helper function to get package by ID
export function getCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
}

// Helper function to calculate price for custom package
export function calculateCustomPrice(credits: number): number {
  const customPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === "custom");
  if (!customPackage || !("pricePerCredit" in customPackage)) {
    throw new Error("Custom package not found");
  }
  return credits * customPackage.pricePerCredit;
}

// Format price for display
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
