export function download(name: string, value: string) {
  const data = "data:text/json;charset=utf-8," + encodeURIComponent(value);
  const el = document.createElement("a");
  el.href = data;
  el.download = `${name}.json`;
  el.click();
}
