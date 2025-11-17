/**
 * Auth.js Sessions Table Schema
 *
 * Stores active user sessions
 *
 * Enhanced with device tracking for security monitoring
 * Sessions are stored in database (not JWT) for better control and revocation
 */

import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Sessions Table (Auth.js Adapter)
 *
 * Required by Auth.js Drizzle adapter
 * Enhanced with security fields
 */
export const sessions = pgTable(
  "sessions",
  {
    // Session token (primary key)
    sessionToken: text("session_token").primaryKey(),

    // Foreign key to users table
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Session expiry
    expires: timestamp("expires", { withTimezone: true }).notNull(),

    // ==================== SECURITY ENHANCEMENTS ====================
    // Device and location tracking for security
    ipAddress: text("ip_address"), // IP address of the session
    userAgent: text("user_agent"), // Browser/device information
    deviceHash: text("device_hash"), // Fingerprint hash for device identification

    // Authentication method tracking
    authMethod: text("auth_method"), // How user authenticated: 'passkey', 'email', 'github', 'google', etc.

    // Geolocation (BigDataCloud IP Geolocation API)
    country: text("country"), // Country name (e.g., "Romania")
    countryCode: text("country_code"), // ISO Alpha-2 code (e.g., "RO" for flag emoji 🇷🇴)
    city: text("city"), // City name (e.g., "Bucharest")
    region: text("region"), // Province/State (e.g., "Bucuresti")
    continent: text("continent"), // Continent (e.g., "Europe")
    latitude: text("latitude"), // Latitude for maps/heatmaps (stored as text to preserve precision)
    longitude: text("longitude"), // Longitude for maps/heatmaps (stored as text to preserve precision)
    timezone: text("timezone"), // IANA timezone (e.g., "Europe/Bucharest")
    isp: text("isp"), // Internet Service Provider / Network organisation

    // Security Detection (BigDataCloud Client Info API)
    isVpn: text("is_vpn"), // "true"/"false" - VPN detection
    isProxy: text("is_proxy"), // "true"/"false" - Proxy detection
    isTor: text("is_tor"), // "true"/"false" - TOR network detection
    isHosting: text("is_hosting"), // "true"/"false" - Datacenter/hosting detection
    isBot: text("is_bot"), // "true"/"false" - Bot detection
    threatLevel: text("threat_level"), // "low"/"medium"/"high" - Overall threat assessment

    // Session metadata
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Indexes for efficient lookups
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    expiresIdx: index("sessions_expires_idx").on(table.expires),
    lastActivityIdx: index("sessions_last_activity_idx").on(
      table.lastActivityAt,
    ),
    ipAddressIdx: index("sessions_ip_address_idx").on(table.ipAddress),
  }),
);

/**
 * Session Type (for SELECT queries)
 */
export type Session = typeof sessions.$inferSelect;

/**
 * Insert Session Type (for INSERT queries)
 */
export type InsertSession = typeof sessions.$inferInsert;
