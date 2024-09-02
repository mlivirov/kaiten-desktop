export {};


declare global {
  interface Date {
    elapsed: () => number;
  }
}