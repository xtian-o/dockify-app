/**
 * Gravatar Integration
 *
 * Provides Gravatar avatar URLs based on email addresses.
 * Used as fallback when user doesn't have OAuth avatar or custom upload.
 *
 * Uses `gravatar-url` package for MD5 hashing (works in browser & server)
 *
 * @see https://docs.gravatar.com/api/avatars/images/
 * @see https://www.npmjs.com/package/gravatar-url
 */

import gravatarUrl from "gravatar-url";

/**
 * Gravatar size options
 */
export type GravatarSize = 32 | 40 | 48 | 64 | 80 | 96 | 128 | 200 | 256 | 512;

/**
 * Gravatar default image options
 *
 * - 404: Return 404 if no gravatar exists
 * - mp: Mystery Person (simple cartoon face)
 * - identicon: Geometric pattern based on email
 * - monsterid: Generated monster with different colors
 * - wavatar: Generated faces with different features
 * - retro: 8-bit arcade style
 * - robohash: Generated robot
 * - blank: Transparent PNG
 */
export type GravatarDefault =
  | "404"
  | "mp"
  | "identicon"
  | "monsterid"
  | "wavatar"
  | "retro"
  | "robohash"
  | "blank";

export interface GravatarOptions {
  /**
   * Size of the avatar (square)
   * Range: 1-2048 pixels
   * Common: 32, 48, 64, 80, 128, 200
   */
  size?: GravatarSize | number;

  /**
   * Default image if no gravatar exists
   * Default: "mp" (Mystery Person)
   */
  default?: GravatarDefault;
}

/**
 * Get Gravatar URL for an email address
 *
 * @param email - User's email address
 * @param options - Gravatar options (size, default)
 * @returns Gravatar image URL
 *
 * @example
 * ```typescript
 * const avatarUrl = getGravatarUrl("user@example.com", { size: 80 });
 * // https://www.gravatar.com/avatar/hash?s=80&d=mp
 * ```
 */
export function getGravatarUrl(
  email: string,
  options: GravatarOptions = {},
): string {
  const { size = 80, default: defaultImage = "mp" } = options;

  return gravatarUrl(email, {
    size,
    default: defaultImage,
  });
}

/**
 * Get best avatar URL for a user
 *
 * Priority:
 * 1. Custom uploaded avatar (if exists - future feature)
 * 2. OAuth provider avatar (Google, GitHub, etc.)
 * 3. Gravatar (based on email)
 * 4. Fallback to null (UI should show initials)
 *
 * @param user - User object with image and email
 * @param options - Gravatar options
 * @returns Avatar URL or null
 *
 * @example
 * ```typescript
 * const avatarUrl = getUserAvatarUrl(session.user, { size: 128 });
 * <Avatar>
 *   <AvatarImage src={avatarUrl || undefined} />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 * ```
 */
export function getUserAvatarUrl(
  user: { image?: string | null; email?: string | null },
  options: GravatarOptions = {},
): string | null {
  // 1. If user has OAuth avatar (from Google/GitHub), use that
  if (user.image) {
    return user.image;
  }

  // 2. If user has email, try Gravatar
  if (user.email) {
    return getGravatarUrl(user.email, options);
  }

  // 3. No avatar available
  return null;
}
