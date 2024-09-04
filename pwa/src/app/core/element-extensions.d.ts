export {}


declare global {
  interface Element {
    getAttributeAsNumber: (name: string) => number|null;
  }
}