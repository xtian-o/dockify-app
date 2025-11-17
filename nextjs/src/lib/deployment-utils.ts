import { db } from "@/db";
import { deployments } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Generate a strong random password
 * Uses crypto.randomBytes for secure random generation
 */
export function generateStrongPassword(length: number = 32): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 16) {
    errors.push("Password must be at least 16 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()\-_=+]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isStrong: errors.length === 0,
    errors,
  };
}

/**
 * Get next available NodePort
 * NodePort range: 30000-32767 (Kubernetes default)
 * Returns a random available port from the range
 */
export async function getNextAvailableNodePort(): Promise<number> {
  const MIN_PORT = 30000;
  const MAX_PORT = 32767;

  // Get all used NodePorts
  const usedPorts = await db
    .select({ nodePort: deployments.nodePort })
    .from(deployments)
    .where(sql`${deployments.nodePort} IS NOT NULL AND ${deployments.deletedAt} IS NULL`);

  const usedPortSet = new Set(usedPorts.map((p) => p.nodePort).filter(Boolean));

  // Try to find an available port (max 100 attempts to avoid infinite loop)
  let attempts = 0;
  while (attempts < 100) {
    // Generate random port in range
    const port = Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT;

    if (!usedPortSet.has(port)) {
      return port;
    }

    attempts++;
  }

  // If we can't find a random port, try sequential search
  for (let port = MIN_PORT; port <= MAX_PORT; port++) {
    if (!usedPortSet.has(port)) {
      return port;
    }
  }

  throw new Error("No available NodePorts in range 30000-32767");
}

/**
 * Generate external URL for a deployment
 * @param host - External host/IP (from env or config)
 * @param nodePort - The allocated NodePort
 * @returns Full external URL
 */
export function generateExternalUrl(host: string, nodePort: number): string {
  // Remove protocol if present
  const cleanHost = host.replace(/^https?:\/\//, "");

  // For now, use HTTP. In production, you might want HTTPS with proper certs
  return `http://${cleanHost}:${nodePort}`;
}

/**
 * Get external host from environment
 * Falls back to default if not configured
 */
export function getExternalHost(): string {
  return process.env.EXTERNAL_HOST || process.env.KUBERNETES_NODE_IP || "localhost";
}
