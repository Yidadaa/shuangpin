export function download(name: string, value: string) {
  const data = "data:text/json;charset=utf-8," + encodeURIComponent(value);
  const el = document.createElement("a");
  el.href = data;
  el.download = `${name}.json`;
  el.click();
}

export function map<K extends string, V, T extends string, U>(
  m: { [k in K]: V },
  func: (_: K, __: V) => [T, U]
) {
  return Object.fromEntries(
    Object.entries(m).map(([k, v]) => func(k as K, v as V))
  );
}

export function shortText(s: string, maxLength = 10, ellipsisText = "...") {
  if (s.length > maxLength) {
    const end = Math.max(0, maxLength - 2);
    return s.slice(0, end) + (maxLength > 0 ? ellipsisText : "");
  }

  return s;
}
