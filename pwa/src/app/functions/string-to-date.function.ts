export function StringToDateFunction(value: string): Date|null {
  if (!value) {
    return null;
  }
  else {
    return new Date(value);
  }
}