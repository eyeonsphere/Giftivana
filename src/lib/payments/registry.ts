/**
 * Payment provider registry.
 *
 * Returns the set of providers available in the current environment.
 * In dev with PAYMENTS_DEMO_ENABLED=true, demo is the default; otherwise
 * manual is the only option until a live provider is added.
 */
import "server-only";

import { demoProvider } from "./demo";
import { manualProvider } from "./manual";
import type { PaymentProvider } from "./types";

const ALL_PROVIDERS: PaymentProvider[] = [demoProvider, manualProvider];

/** All providers whose isAvailable() returns true, demo first. */
export function getAvailableProviders(): PaymentProvider[] {
  return ALL_PROVIDERS.filter((p) => p.isAvailable());
}

/** Look up a provider by its name (e.g. "demo", "manual"). */
export function getProvider(name: string): PaymentProvider | null {
  return ALL_PROVIDERS.find((p) => p.name === name && p.isAvailable()) ?? null;
}

/**
 * The default provider for new checkouts.
 * Demo if available (dev only), otherwise manual.
 */
export function getDefaultProvider(): PaymentProvider {
  if (demoProvider.isAvailable()) return demoProvider;
  return manualProvider;
}
