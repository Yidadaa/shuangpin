import rawXhyx from "./xhyx.json";

type RawXhyxInfo = {
  "1"?: string;
  "2"?: string;
  "3"?: string;
  "4"?: string;
};

function uniq<T>(items: T[]) {
  return [...new Set(items)];
}

function parseCodes(raw = "") {
  return uniq(
    raw
      .split(/\s+/)
      .map((item) => item.toLowerCase().replace(/[^a-z]/g, ""))
      .filter((item) => item.length >= 4)
      .map((item) => item.slice(0, 4))
  );
}

function parsePinyins(raw = "") {
  return uniq(
    raw
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  );
}

export interface XhyxInfo {
  codes: string[];
  shape: string;
  structure: string;
  pinyins: string[];
}

const xhyxMap = new Map<string, XhyxInfo>();

Object.entries(rawXhyx as Record<string, RawXhyxInfo>).forEach(
  ([hanzi, info]) => {
    const codes = parseCodes(info["1"]);
    if (codes.length === 0) return;

    xhyxMap.set(hanzi, {
      codes,
      shape: info["2"] ?? "",
      structure: info["3"] ?? "",
      pinyins: parsePinyins(info["4"]),
    });
  }
);

export function getXhyxInfo(hanzi: string) {
  return xhyxMap.get(hanzi);
}
