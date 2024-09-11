export function getTextOrDefault(value: string, def: string = 'Default'): string {
  if (value?.length) {
    return value;
  }

  return def;
}