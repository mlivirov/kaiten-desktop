export interface CardProperties {
  [key: `id_${number}`]: number[] | string[] | number | { date: string } | string | boolean;
}