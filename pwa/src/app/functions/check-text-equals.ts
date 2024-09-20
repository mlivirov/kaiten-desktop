export function checkTextEquals(a: string, b: string): boolean {
  a ??= '';
  b ??= '';

  return a.trim() === b.trim();
}
