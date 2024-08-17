export function CloneFunction<T>(obj: T): T {
  if (typeof obj !== 'object' || !obj) {
    return obj;
  }

  const res: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      res[key] = CloneFunction(obj[key]);
    }
  }

  return Object.assign(res, obj) as T;
}