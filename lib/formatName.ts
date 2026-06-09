export function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function isFullName(value: string): boolean {
  return value.trim().split(/\s+/).filter(Boolean).length >= 2;
}
