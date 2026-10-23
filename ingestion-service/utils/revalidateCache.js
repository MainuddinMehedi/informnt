import { emitAdminNotification } from "../notifications/index.js";

/**
 * Resolves the Next.js API revalidation endpoint using available env vars.
 * Supports APP_URL, FRONTEND_URL, NEXT_PUBLIC_APP_URL, NEXTAUTH_URL, and NEXT_PUBLIC_API_URL.
 */
function resolveRevalidateEndpoint() {
  let base =
    process.env.APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";

  base = base.trim().replace(/\/+$/, "");

  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }

  return `${base}/revalidate`;
}

/**
 * Triggers cache revalidation for the specified tags on the Next.js frontend.
 * Catches connection errors and logs success or warning status messages.
 *
 * @param {string[]} tags - Array of tags to revalidate
 * @returns {Promise<void>}
 */
export default async function revalidateCache(tags) {
  if (!tags || tags.length === 0) return;

  const endpoint = resolveRevalidateEndpoint();
  const revalidateSecret = (process.env.REVALIDATE_SECRET || "").trim();

  if (!revalidateSecret) {
    console.warn("⚠️ [Cache Revalidation] REVALIDATE_SECRET is not defined in environment variables.");
  }

  console.log(`\n🔄 Revalidating cache tags at: ${endpoint}`);

  for (const tag of tags) {
    try {
      const url = `${endpoint}?tag=${encodeURIComponent(tag)}&secret=${encodeURIComponent(revalidateSecret)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-revalidate-secret": revalidateSecret,
        },
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        console.warn(`⚠️ Failed to revalidate tag "${tag}": HTTP ${res.status} (${bodyText}) at ${endpoint}`);
        await emitAdminNotification("REVALIDATION_FAILED", {
          tag,
          error: `HTTP ${res.status}: ${bodyText || res.statusText}`,
        });
      } else {
        console.log(`✓ Revalidated tag: ${tag}`);
      }
    } catch (err) {
      console.error(`⚠️ Network error revalidating tag "${tag}" against ${endpoint}:`, err.message);
      await emitAdminNotification("REVALIDATION_FAILED", {
        tag,
        error: `Network error: ${err.message}`,
      });
    }
  }
}
