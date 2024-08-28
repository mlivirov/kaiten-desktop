export function UnionIfNotExistsFunction(collection: Array<any>, item: any, idProperty: string): Array<any> {
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