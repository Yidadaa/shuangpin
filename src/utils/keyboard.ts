import { product } from "./number";
import { validCombines } from "./pinyin";
import configs from "./spconfig.json";

declare global {
  type ShuangpinType = keyof typeof configs;
}

export const shuangpins = Object.keys(configs) as [ShuangpinType];

export function loadShuangpinConfig(name: ShuangpinType): ShuangpinMode {
  const config = configs[name];
  const mode: ShuangpinMode = {
    name,
    groupByKey: new Map(),
    groupByLead: new Map(),
    groupByFollow: new Map(),
    sp2zero: new Map(),
    zero2sp: new Map(),
    sp2py: new Map(),
    py2sp: new Map(),
  };

  for (const line of config["keyMap"]) {
    const [main, follow, lead] = line.split("/");
    const keyConfig: KeyConfig = {
      main: (main as Char) ?? "",
      follows: follow?.split(",") ?? [],
      leads: lead?.split(",") ?? [],
    };
    mode.groupByKey.set(keyConfig.main, keyConfig);
    keyConfig.leads.forEach((lead) => mode.groupByLead.set(lead, keyConfig));
    keyConfig.follows.forEach((follow) =>
      mode.groupByFollow.set(follow, keyConfig)
    );
  }

  for (const line of config["zeroMap"]) {
    const [sp, zero] = line.split("/");
    mode.sp2zero.set(sp, zero);
    mode.zero2sp.set(zero, sp);
    mode.py2sp.set(zero, sp);
    mode.sp2py.set(sp, zero);
  }

  const allCombs = product(
    [...mode.groupByLead.keys()],
    [...mode.groupByFollow.keys()]
  );
  for (const [lead, follow] of allCombs) {
    const sp = lead + follow;
    const leads = mode.groupByLead.get(lead)!.leads;
    const follows = mode.groupByLead.get(lead)!.follows;
    for (const [l, f] of product(leads, follows)) {
      const pinyin = l + f;
      if (validCombines.has(pinyin)) {
        mode.py2sp.set(pinyin, sp);
        mode.sp2py.set(sp, pinyin);
      }
    }
  }

  return mode;
}

export const keyboardLayout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export function matchSpToPinyin(
  mode: ShuangpinMode,
  leadKey: Char,
  followKey: Char,
  targetPinyin: string
) {
  const allMatched = !!leadKey && !!followKey;
  const leads = mode.groupByKey.get(leadKey)?.leads ?? [];
  const follows = mode.groupByKey.get(followKey)?.follows ?? [];
  let combines = product(leads.concat(""), follows.concat("")).filter(
    ([a, b]) => !!a || !!b
  );

  let lead = leadKey as string;
  let follow = followKey as string;

  // 匹配零声母
  const zero = (leadKey ?? "") + (followKey ?? "");
  if (mode.sp2zero.has(zero)) {
    const valid = mode.sp2zero.get(zero) === targetPinyin;
    return {
      valid,
      lead,
      follow,
    };
  }
  // 完全匹配
  const valid = combines.some(([l, f]) => {
    if (l + f === targetPinyin) {
      (lead = l), (follow = f);

      return true;
    }
  });

  if (!valid) {
    // 匹配声母的情况
    combines.some(([l, f]) => {
      if (l.length && targetPinyin?.startsWith(l)) {
        lead = l;

        return true;
      }

      if (f.length && targetPinyin?.endsWith(f)) {
        follow = f;

        return true;
      }
    });
  }

  return {
    valid: valid && allMatched,
    lead,
    follow,
  };
}
