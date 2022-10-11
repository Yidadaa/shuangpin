import { download } from "./common";
import { product } from "./number";
import { validCombines } from "./pinyin";
import configs from "./spconfig.json";

declare global {
  type ShuangpinType = keyof typeof configs;

  /**
   * ```ts
   * {
   *   keyMap: [ // 按键映射
   *    '${键盘按键小写字符}/${韵母1,韵母2...}/${声母1,声母2...}'
   *   ],
   *   zeroMap: [ // 零声母映射
   *     '${双拼按键}/${对应拼音}'
   *   ]
   * }
   * ```
   */
  type RawShuangPinConfig = typeof configs["小鹤双拼"];
  type ShuangpinMode = ShuangpinConfig;
}

export const PresetConfigs = configs;

export function encodeShuangpin() {}
export class ShuangpinConfig {
  groupByKey = new Map<Char, KeyConfig>(); // 键盘 -> KeyConfig
  groupByFollow = new Map<string, KeyConfig>(); // 声母 -> KeyConfig
  groupByLead = new Map<string, KeyConfig>(); // 韵母 -> KeyConfig
  sp2zero = new Map<string, string>(); // 零声母 -> 双拼
  zero2sp = new Map<string, string>(); // 双拼 -> 零声母
  sp2py = new Map<string, string>(); // 双拼 -> 拼音
  py2sp = new Map<string, string>(); // 拼音 -> 双拼

  constructor(
    public name: string,
    public config: RawShuangPinConfig,
    public custom = false
  ) {
    for (const line of config["keyMap"]) {
      const [main, follow, lead] = line.split("/");
      const keyConfig: KeyConfig = {
        main: (main as Char) ?? "",
        follows: follow?.split(",") ?? [],
        leads: lead?.split(",") ?? [],
      };
      this.groupByKey.set(keyConfig.main, keyConfig);
      keyConfig.leads.forEach((lead) => this.groupByLead.set(lead, keyConfig));
      keyConfig.follows.forEach((follow) =>
        this.groupByFollow.set(follow, keyConfig)
      );
    }

    for (const line of config["zeroMap"]) {
      const [sp, zero] = line.split("/");
      this.sp2zero.set(sp, zero);
      this.zero2sp.set(zero, sp);
      this.py2sp.set(zero, sp);
      this.sp2py.set(sp, zero);
    }

    const allCombs = product(
      [...this.groupByKey.keys()],
      [...this.groupByKey.keys()]
    );
    for (const [lead, follow] of allCombs) {
      const sp = lead + follow;
      const leads = this.groupByKey.get(lead)!.leads;
      const follows = this.groupByKey.get(follow)!.follows;
      const pinyins = product(leads, follows);
      for (const [l, f] of pinyins) {
        const pinyin = l + f;
        if (validCombines.has(pinyin)) {
          this.py2sp.set(pinyin, sp);
          this.sp2py.set(sp, pinyin);
        }
      }
    }
  }

  download() {
    download(this.name, JSON.stringify(this.config));
  }
}

export const keyboardLayout = ["qwertyuiop", " asdfghjkl;", "zxcvbnm"];

export function mergeString([a, b]: string[] = []) {
  if (!(a && b && a.length > 2 && b.length > 2)) {
    return [a, b].join(" ");
  }
  const aChars = a.split("");
  const bChars = b.split("");
  const commonSuffix = [];

  while (
    aChars.length &&
    bChars.length &&
    aChars[aChars.length - 1] === bChars[bChars.length - 1]
  ) {
    commonSuffix.push(aChars.pop());
    bChars.pop();
  }

  const prefixs = [aChars.join(""), bChars.join("")].filter(
    (v) => v.length > 0
  );

  if (commonSuffix.length === 0) {
    return prefixs.join(" ");
  }

  const prefix = prefixs.join("/");
  const suffix = commonSuffix.reverse().join("");

  return `(${prefix})${suffix}`;
}

export function mapConfigToLayout(config: ShuangpinMode) {
  return keyboardLayout.map((v) =>
    v.split("").map((key) => {
      const keyConfig = config.groupByKey.get(key as Char) ?? {
        main: key,
        leads: [],
        follows: [],
      };
      return {
        main: keyConfig.main,
        lead: mergeString(keyConfig.leads.filter((v) => v !== keyConfig.main)),
        follow: mergeString(keyConfig.follows),
        leads: keyConfig.leads,
        follows: keyConfig.follows,
      };
    })
  );
}

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
