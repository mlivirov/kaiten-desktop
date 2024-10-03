export function unionIfNotExists<T>(collection: Array<T>, item: T, idProperty: keyof T): Array<T> {
  const result = [];

  if (collection?.length) {
    result.push(...collection);
  }

  if (result.find(t => t[idProperty] === item[idProperty])) {
    return result;
  }

  result.push(item);

  return result;
}
