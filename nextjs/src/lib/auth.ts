/**
 * Auth.js v5 Configuration
 *
 * Simplified authentication setup with:
 * - Email OTP (via Resend)
 * - Database sessions (Drizzle adapter)
 *
 * @see https://authjs.dev
 */

import type { DefaultSession } from "next-auth";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { Resend as ResendClient } from "resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import type { User as DBUser } from "@/db/schema";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";

/**
 * Module augmentation for Auth.js types
 * Extends session to include user ID and status
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      status: DBUser["status"];
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    status: DBUser["status"];
    emailVerified: Date | null;
  }
}

/**
 * Auth.js Configuration
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // ==================== ADAPTER ====================
  // Using Drizzle Adapter for database sessions
  // @ts-expect-error - Type mismatch between next-auth v5 beta and drizzle-adapter
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  // ==================== PROVIDERS ====================
  providers: [
    // Email OTP Provider (via Resend)
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      // Using verified domain
      from: "noreply@dockify.io",

      // Generate 6-digit OTP instead of magic link
      generateVerificationToken: () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      },

      // Custom email template
      sendVerificationRequest: async ({
        identifier: email,
        url,
        provider,
        token,
        request,
      }) => {
        // Initialize Resend client (lazy initialization to avoid build-time errors)
        const resend = new ResendClient(process.env.AUTH_RESEND_KEY!);

        // Extract host from request
        const host = request?.headers?.get("host") || "main.dockify.app";
        try {
          if (process.env.NODE_ENV === "development") {
            console.log("[Resend] Sending OTP email to:", email);
            console.log("[Resend] From:", provider.from);
            console.log("[Resend] Token:", token);
          }

          const result = await resend.emails.send({
            from: provider.from as string,
            to: email,
            subject: "Your sign-in code for Dockify",
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Sign in to ${host}</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                      line-height: 1.6;
                      color: #333;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 20px;
                    }
                    .container {
                      background: #ffffff;
                      border-radius: 8px;
                      padding: 40px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .logo {
                      text-align: center;
                      margin-bottom: 30px;
                    }
                    h1 {
                      color: #1a1a1a;
                      font-size: 24px;
                      margin-bottom: 20px;
                      text-align: center;
                    }
                    .code {
                      background: #f5f5f5;
                      border: 2px solid #e0e0e0;
                      border-radius: 8px;
                      padding: 20px;
                      text-align: center;
                      margin: 30px 0;
                    }
                    .code-value {
                      font-size: 48px;
                      font-weight: bold;
                      letter-spacing: 8px;
                      color: #2563eb;
                      font-family: 'Courier New', monospace;
                    }
                    .info {
                      color: #666;
                      font-size: 14px;
                      text-align: center;
                      margin-top: 20px;
                    }
                    .warning {
                      background: #fff3cd;
                      border-left: 4px solid #ffc107;
                      padding: 12px;
                      margin-top: 20px;
                      font-size: 13px;
                      color: #856404;
                    }
                    .footer {
                      text-align: center;
                      margin-top: 40px;
                      padding-top: 20px;
                      border-top: 1px solid #e0e0e0;
                      color: #999;
                      font-size: 12px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="logo">
                      <h2>🔐 DOCKIFY</h2>
                    </div>

                    <h1>Welcome back!</h1>

                    <p>Your verification code is:</p>

                    <div class="code">
                      <div class="code-value">${token}</div>
                    </div>

                    <p class="info">
                      This code will expire in <strong>10 minutes</strong>.
                    </p>

                    <div class="warning">
                      ⚠️ <strong>Security Notice:</strong> Never share this code with anyone.
                      Our team will never ask for your verification code.
                    </div>

                    <div class="footer">
                      <p>
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                      <p>
                        © ${new Date().getFullYear()} Dockify. All rights reserved.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });

          if (process.env.NODE_ENV === "development") {
            console.log("[Resend] Email sent successfully!");
            console.log("[Resend] Email ID:", result.data?.id);
          }

          // Save token in Redis for client-side verification (TTL: 10 minutes)
          // Lazy import redis to avoid Edge Runtime compatibility issues
          const { redis } = await import("@/lib/redis");
          const redisKey = `otp:${email.toLowerCase()}`;
          await redis.setex(redisKey, 600, token); // 600 seconds = 10 minutes

          if (process.env.NODE_ENV === "development") {
            console.log("[Redis] OTP saved for email:", email);
          }
        } catch (error) {
          console.error("[Resend] Failed to send verification email:", error);
          console.error(
            "[Resend] Error details:",
            JSON.stringify(error, null, 2),
          );
          throw new Error("Failed to send verification email");
        }
      },

      // Token expiry (10 minutes)
      maxAge: 10 * 60, // 600 seconds
    }),
  ],

  // ==================== SESSION ====================
  session: {
    strategy: "jwt", // JWT sessions (Edge Runtime compatible)
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days (same as session)
  },

  // ==================== COOKIES ====================
  cookies: {
    sessionToken: {
      name: `${process.env.NEXTAUTH_URL?.startsWith("https://") ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true, // Prevents JavaScript access (XSS protection)
        sameSite: "lax", // CSRF protection
        path: "/",
        secure:
          process.env.NEXTAUTH_URL?.startsWith("https://") ||
          process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `${process.env.NEXTAUTH_URL?.startsWith("https://") ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure:
          process.env.NEXTAUTH_URL?.startsWith("https://") ||
          process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NEXTAUTH_URL?.startsWith("https://")
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure:
          process.env.NEXTAUTH_URL?.startsWith("https://") ||
          process.env.NODE_ENV === "production",
      },
    },
  },

  // ==================== PAGES ====================
  pages: {
    signIn: "/sign-in", // Custom sign-in page
    error: "/sign-in", // Redirect errors to sign-in page
    verifyRequest: "/sign-in", // Email verification page
  },

  // ==================== CALLBACKS ====================
  callbacks: {
    /**
     * JWT Callback
     *
     * This callback is called whenever a JWT is created or updated
     * We use it to add custom fields to the token
     */
    async jwt({ token, user, trigger }) {
      // On sign in, add user info to token
      if (user) {
        token.id = user.id;
        token.status = user.status;
        token.emailVerified = user.emailVerified;
      }

      // On session update, refresh user data from database
      if (trigger === "update") {
        // You can fetch fresh user data here if needed
      }

      return token;
    },

    /**
     * Session Callback
     *
     * Adds custom fields to the session object from the JWT token
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.status = token.status as DBUser["status"];
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },

    /**
     * Sign In Callback
     *
     * Controls whether a user is allowed to sign in
     */
    async signIn({ user }) {
      // Check if user is suspended or deleted
      if (user.status === "suspended") {
        console.warn(`Blocked login attempt for suspended user: ${user.email}`);
        return "/sign-in?error=AccountSuspended";
      }

      if (user.status === "deleted") {
        console.warn(`Blocked login attempt for deleted user: ${user.email}`);
        return "/sign-in?error=AccountDeleted";
      }

      // Check if user is locked (too many failed attempts)
      if (user.status === "locked") {
        console.warn(`Blocked login attempt for locked user: ${user.email}`);
        return "/sign-in?error=AccountLocked";
      }

      // Allow sign in
      return true;
    },

    /**
     * Redirect Callback
     *
     * Controls where to redirect after sign in/out
     */
    async redirect({ url, baseUrl }) {
      // Handle verification errors - redirect to appropriate page
      if (url.includes("error=Verification")) {
        // Check if this was from get-started based on callbackUrl
        const urlObj = new URL(url, baseUrl);
        const callbackUrl = urlObj.searchParams.get("callbackUrl");

        // If coming from /dashboard (default for get-started), return to get-started
        if (callbackUrl?.includes("/dashboard")) {
          return `${baseUrl}/get-started?error=Verification`;
        }

        // Otherwise assume it's from sign-in
        return `${baseUrl}/sign-in?error=Verification`;
      }

      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;

      // Default redirect
      return baseUrl;
    },
  },

  // ==================== EVENTS ====================
  events: {
    /**
     * Create User Event
     *
     * Triggered when a new user is created
     */
    async createUser({ user }) {
      console.log(`🆕 New user created: ${user.email}`);
    },
  },

  // ==================== SECURITY ====================
  debug: process.env.NODE_ENV === "development", // Enable debug logs in development

  // Trust host (required for production)
  trustHost: true,
});
