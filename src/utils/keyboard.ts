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
    [...mode.groupByKey.keys()],
    [...mode.groupByKey.keys()]
  );
  for (const [lead, follow] of allCombs) {
    const sp = lead + follow;
    const leads = mode.groupByKey.get(lead)!.leads;
    const follows = mode.groupByKey.get(follow)!.follows;
    const pinyins = product(leads, follows);
    for (const [l, f] of pinyins) {
      const pinyin = l + f;
      if (validCombines.has(pinyin)) {
        mode.py2sp.set(pinyin, sp);
        mode.sp2py.set(sp, pinyin);
      }
    }
  }

  return mode;
}

export const keyboardLayout = ["qwertyuiop", " asdfghjkl;", "zxcvbnm"];

export function matchSpToPinyin(
  mode: ShuangpinMode,
  leadKey: Char,
  followKey: Char,
  targetPinyin: string
) {
  const allMatched = !!leadKey && !!followKey;
  const leads = mode.groupByKey.get(leadKey)?.leads ?? [];
  const follows = mode.groupByKey.get(followKey)?.follows ?? [];
  const combines = product(leads.concat(""), follows.concat("")).filter(
    ([a, b]) => !!a || !!b
  );

  let lead = leadKey as string;
  let follow = followKey as string;

  const sp = (lead ?? "") + (follow ?? "");
  const valid = mode.sp2py.get(sp) === targetPinyin;

  if (valid) {
    lead = validCombines.get(targetPinyin)!.lead;
    follow = validCombines.get(targetPinyin)!.follow;
  }

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
