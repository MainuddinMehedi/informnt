import dns from "node:dns/promises";

/**
 * Checks whether an IP address belongs to loopback, link-local, or private RFC ranges.
 */
export function isPrivateIp(ip: string): boolean {
  if (ip === "localhost" || ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("169.254.")) return true; // Link-local / Cloud metadata (AWS, GCP, Azure)
  if (ip.startsWith("10.")) return true; // RFC 1918 Class A
  if (ip.startsWith("192.168.")) return true; // RFC 1918 Class C

  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = parseInt(match172[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true; // RFC 1918 Class B
  }

  if (ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd")) {
    return true; // IPv6 ULA
  }
  if (ip.toLowerCase().startsWith("fe80")) {
    return true; // IPv6 link-local
  }

  return false;
}

/**
 * Validates a target URL against SSRF attacks before making outbound HTTP requests.
 */
export async function validateSafeUrl(
  rawUrl: string,
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        reason: "Only HTTP and HTTPS protocols are supported.",
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan")
    ) {
      return {
        valid: false,
        reason: "Access to local and internal network hostnames is prohibited.",
      };
    }

    if (isPrivateIp(hostname)) {
      return {
        valid: false,
        reason: "Access to private or internal IP addresses is prohibited.",
      };
    }

    try {
      const records = await dns.lookup(hostname, { all: true });
      for (const record of records) {
        if (isPrivateIp(record.address)) {
          return {
            valid: false,
            reason: `Target address resolves to a restricted private address (${record.address}).`,
          };
        }
      }
    } catch {
      // If DNS resolution fails, allow fetch to handle or fail naturally
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }
}
