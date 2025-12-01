import { hanziMap } from "./hanzi";
import { product } from "./number";

export const zeroLeadKeys = "a ai an ang ao e ei en eng er o ou".split(" ");

export const leadKeys =
  "b p m f d t n l g k h j q x zh ch sh r z c s y w".split(" ");

export const singleFollowKeys = "a o e i u v".split(" ");

export const multiFollowKeys =
  "ai ei ao ou an en ang eng er ia ie iao iu ian in iang ing ua uo uai ui uan un uang ong ve ue iong".split(
    " "
  );

export const followKeys = singleFollowKeys.concat(multiFollowKeys);

export const validCombines: Map<string, Pinyin> = new Map();
export const leadMap: Map<string, Pinyin[]> = new Map();
export const followMap: Map<string, Pinyin[]> = new Map();

product(leadKeys.concat(""), followKeys).forEach(([lead, follow]) => {
  const pinyin = {
    lead,
    follow,
    full: lead + follow,
  };

  if (hanziMap.p2h.has(pinyin.full)) {
    validCombines.set(pinyin.full, pinyin);
    if (!leadMap.has(lead)) leadMap.set(lead, []);
    if (!followMap.has(follow)) followMap.set(follow, []);
    leadMap.get(lead)?.push(pinyin);
    followMap.get(follow)?.push(pinyin);
  }
});

function pushMap<K, V>(m: Map<K, V[]>, k: K, v: V) {
  if (!m.has(k)) {
    m.set(k, []);
  }

  m.get(k)!.push(v);
}

validCombines.forEach((v) => {
  pushMap(leadMap, v.lead, v);
  pushMap(followMap, v.follow, v);
});

export const pinyinSummary = {
  leadCount: leadKeys.length,
  followCount: followKeys.length,
  singleFollowCount: singleFollowKeys.length,
  multiFollowCount: multiFollowKeys.length,
};

export function getCombineOf(p: Pinyin) {
  return p.lead + p.follow;
}

/**
 * 生成拼音的提示文字
 * @param pinyins 提示拼音列表
 * @returns
 */
export function shortPinyin(pinyins: string[]) {
  const ret = [];
  let count = 0;
  for (const py of pinyins) {
    if (count + py.length <= 10) {
      count += py.length;
      ret.push(py.toUpperCase());
    }
  }
  return ret.join("/");
}
