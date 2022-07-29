export function randInt(n: number) {
  return Math.floor(Math.random() * n);
}

export function product<T, K>(a: T[], b: K[]) {
  const ret: [T, K][] = [];
  for (const x of a) {
    for (const y of b) {
      ret.push([x, y]);
    }
  }

  return ret;
}

export function randomChoice<T>(arr: T[]) {
  if (arr.length == 0) return undefined
  return arr[randInt(arr.length)]
}
