/**
 * Format name to capitalize first letter of each word
 * @param name - Name to format
 * @returns Formatted name
 */
export function formatName(name: string): string {
  return name
    .split(" ")
    .map((word) => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
