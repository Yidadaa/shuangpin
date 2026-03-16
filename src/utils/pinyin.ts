import { product } from "./number";

export const zeroLeadKeys = "a ai an ang ao e ei en eng er o ou".split(" ");
export const progressiveKeys =
  "e d i u y zh sh l j h b a x ong ao g ei uo ai an w en t z ing m ang ian iao ou q ch eng n f uan k r ui in iang ie s o c p un iu ue ia er uai ua uang v iong".split(
    " ",
  );
export const leadKeys =
  "b p m f d t n l g k h j q x zh ch sh r z c s y w".split(" ");

export const singleFollowKeys = "a o e i u v".split(" ");

export const multiFollowKeys =
  "ai ei ao ou an en ang eng er ia ie iao iu ian in iang ing ua uo uai ui uan un uang ong ve ue iong".split(
    " ",
  );

export const followKeys = singleFollowKeys.concat(multiFollowKeys);

export const validCombines: Map<string, Pinyin> = new Map();
export const leadMap: Map<string, Pinyin[]> = new Map();
export const followMap: Map<string, Pinyin[]> = new Map();

import pinyinData from "./pinyin-hanzi.json";

const pinyinDict = pinyinData as Record<string, string>;

product(leadKeys.concat(""), followKeys).forEach(([lead, follow]) => {
  const fullPinyin = lead + follow;

  const pinyin = {
    lead,
    follow,
    full: fullPinyin,
  };

  if (fullPinyin in pinyinDict) {
    validCombines.set(fullPinyin, pinyin);

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
