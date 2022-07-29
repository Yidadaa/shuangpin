import hanziTable from "./hanzi.json";

type HanziLib = typeof hanziTable.popular;

function buildTable({ pinyin, hanzi }: HanziLib) {
  const h2p = new Map<string, string[]>;
  const p2h = new Map<string, string[]>;

  for (let i = 0; i < pinyin.length; i += 1) {
    const h = hanzi[i];
    const ps = pinyin[i];

    h2p.set(h, ps)

    for (const p of ps) {
      if (!p2h.has(p)) p2h.set(p, [])
      p2h.get(p)?.push(h)
    }
  }

  return { h2p, p2h };
}

export const hanziMap = buildTable(hanziTable.popular);
export const hanziList = hanziTable.popular;

export function getPinyinOf(hanzi: string) {
  return hanziMap.h2p.get(hanzi) ?? [];
}

export function getHanziOf(pinyin: string) {
  return hanziMap.p2h.get(pinyin) ?? ''
}
