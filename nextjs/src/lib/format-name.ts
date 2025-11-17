/**
 * Name Formatting Utilities
 *
 * Provides functions to format and validate user names.
 * Used in signup and profile forms.
 */

/**
 * Capitalize first letter of each word
 *
 * @param text - Input text
 * @returns Capitalized text
 *
 * @example
 * capitalizeWords("john doe") → "John Doe"
 * capitalizeWords("MARY SMITH") → "Mary Smith"
 * capitalizeWords("jean-paul") → "Jean-Paul"
 */
export function capitalizeWords(text: string): string {
  if (!text) return "";

  return text
    .split(/(\s+|-)/g) // Split by spaces and hyphens, keeping delimiters
    .map((word) => {
      if (!word || word.match(/^\s+$/) || word === "-") {
        return word; // Keep whitespace and hyphens as-is
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

/**
 * Remove extra whitespace
 *
 * - Trims leading/trailing spaces
 * - Removes multiple consecutive spaces
 * - Preserves single spaces between words
 *
 * @param text - Input text
 * @returns Cleaned text
 *
 * @example
 * removeExtraSpaces("  john   doe  ") → "john doe"
 * removeExtraSpaces("mary    smith") → "mary smith"
 */
export function removeExtraSpaces(text: string): string {
  if (!text) return "";

  return text
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, " "); // Replace multiple spaces with single space
}

/**
 * Format name with capitalization and space removal
 *
 * Combines capitalizeWords and removeExtraSpaces for a clean, properly formatted name.
 *
 * @param name - Input name
 * @returns Formatted name
 *
 * @example
 * formatName("  john   doe  ") → "John Doe"
 * formatName("mary-jane") → "Mary-Jane"
 * formatName("o'brien") → "O'brien"
 * formatName("  ALICE  BOB  ") → "Alice Bob"
 */
export function formatName(name: string): string {
  if (!name) return "";

  // 1. Remove extra spaces
  const cleaned = removeExtraSpaces(name);

  // 2. Capitalize words
  const capitalized = capitalizeWords(cleaned);

  return capitalized;
}

/**
 * Format full name (combines first, middle, last)
 *
 * @param firstName - First name
 * @param middleName - Middle name (optional)
 * @param lastName - Last name
 * @returns Full name string
 *
 * @example
 * formatFullName("john", "m.", "doe") → "John M. Doe"
 * formatFullName("mary", "", "smith") → "Mary Smith"
 */
export function formatFullName(
  firstName: string,
  middleName: string,
  lastName: string,
): string {
  const parts = [
    formatName(firstName),
    formatName(middleName),
    formatName(lastName),
  ].filter(Boolean); // Remove empty strings

  return parts.join(" ");
}

/**
 * Get middle name initial
 *
 * @param middleName - Middle name
 * @returns Middle initial with period (e.g., "M.")
 *
 * @example
 * getMiddleInitial("marius") → "M."
 * getMiddleInitial("") → ""
 * getMiddleInitial("m.") → "M."
 */
export function getMiddleInitial(middleName: string): string {
  if (!middleName) return "";

  const cleaned = middleName.trim();
  if (!cleaned) return "";

  // If already an initial (like "M." or "m"), just format it
  if (cleaned.length <= 2 && cleaned.includes(".")) {
    return `${cleaned.charAt(0).toUpperCase()}.`;
  }

  // Get first character and add period
  return `${cleaned.charAt(0).toUpperCase()}.`;
}

/**
 * Format display name with middle initial
 *
 * Formats name as: "First M. Last"
 *
 * @param name - Full name string (or just first/last)
 * @returns Formatted display name
 *
 * @example
 * formatDisplayName("John Marius Doe") → "John M. Doe"
 * formatDisplayName("John Doe") → "John Doe"
 * formatDisplayName("John M. Doe") → "John M. Doe"
 */
export function formatDisplayName(name: string): string {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    // Just first name
    return formatName(parts[0]);
  }

  if (parts.length === 2) {
    // First and last name
    return `${formatName(parts[0])} ${formatName(parts[1])}`;
  }

  // Three or more parts: First Middle Last
  // Take first part, middle parts as initials, last part
  const firstName = formatName(parts[0]);
  const lastName = formatName(parts[parts.length - 1]);
  const middleParts = parts.slice(1, -1);

  // Get initials for middle names
  const middleInitials = middleParts
    .map((part) => getMiddleInitial(part))
    .filter(Boolean)
    .join(" ");

  if (middleInitials) {
    return `${firstName} ${middleInitials} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
}
