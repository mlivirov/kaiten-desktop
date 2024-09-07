import murmurhash from "murmurhash";

export function getPastelColor(value: string): string {
  const hash = murmurhash(value);
  return `hsla(${~~(35 + 240 * ((hash % 20) / 20))}, 50%,  85%)`;
}