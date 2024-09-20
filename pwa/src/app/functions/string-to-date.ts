export function stringToDate(value: string): Date|null {
  if (!value) {
    return null;
  }
  else {
    return new Date(value);
  }
}
