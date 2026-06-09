/**
 * Feature flags read from build-time env vars.
 *
 * To toggle a flag in a given environment, set the corresponding
 * `VITE_*_ENABLED` variable in Vercel (Production / Preview) and redeploy.
 * Flags default to OFF so the launch UI stays minimal — opt in explicitly
 * when a feature is ready to ship.
 */

function readBoolEnv(name: string): boolean {
  return (import.meta.env[name] as string | undefined)?.toLowerCase() === "true";
}

/**
 * Online retail shop: product browse, cart, checkout. Hidden for launch
 * because order fulfillment / shipping is out of scope; the admin still
 * manages the product catalog so the data stays warm for v2.
 */
export const SHOP_ENABLED = readBoolEnv("VITE_SHOP_ENABLED");
