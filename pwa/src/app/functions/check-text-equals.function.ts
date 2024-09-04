export function CheckTextEqualsFunction(a: string, b: string): boolean {
  a ??= '';
  b ??= '';

  return a.trim() === b.trim();
}