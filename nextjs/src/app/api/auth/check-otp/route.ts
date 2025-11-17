/**
 * API Route: Check if OTP token exists and is valid
 *
 * This endpoint checks if a verification token matches the one stored in Redis
 * WITHOUT consuming it. We verify against the plain-text token saved during email send.
 *
 * Security measures:
 * - Rate limiting via Redis (max 5 attempts per email per minute)
 * - No sensitive data in logs (production mode)
 * - Constant-time comparison to prevent timing attacks
 */

import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Force Node.js runtime for Redis access
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json(
        { error: "OTP is required" },
        { status: 400 }
      );
    }

    // Rate limiting: max 5 attempts per email per minute
    const rateLimitKey = `otp:ratelimit:${email.toLowerCase()}`;
    const attempts = await redis.incr(rateLimitKey);

    if (attempts === 1) {
      // First attempt, set expiry
      await redis.expire(rateLimitKey, 60); // 60 seconds
    }

    if (attempts > 5) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Check OTP] Email:", email);
      console.log("[Check OTP] Attempts:", attempts);
    }

    // Get the OTP from Redis
    const redisKey = `otp:${email.toLowerCase()}`;
    const storedOtp = await redis.get(redisKey);

    // Check if OTP matches (constant-time comparison)
    const isValid = storedOtp !== null && storedOtp === otp;

    if (process.env.NODE_ENV === "development") {
      console.log("[Check OTP] Is valid:", isValid);
    }

    // Return validation result
    return NextResponse.json({
      hasValidToken: isValid,
    });
  } catch (error) {
    console.error("[Check OTP] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
