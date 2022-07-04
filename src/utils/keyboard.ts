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
  }

  return mode;
}

export const keyboardLayout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export function getPinyinOfSp(
  mode: ShuangpinMode,
  leadKey: Char,
  followKey: Char,
  shouldBeValid = false
) {
  const leads = mode.groupByKey.get(leadKey)?.leads ?? [];
  const follows = mode.groupByKey.get(followKey)?.follows ?? [];
  let combines = product(leads.concat(""), follows.concat("")).filter(
    ([a, b]) => !!a || !!b
  );

  if (shouldBeValid) {
    combines = combines.filter(([a, b]) => validCombines.has(a + b));
  }

  // 匹配零声母
  const zero = (leadKey ?? "") + (followKey ?? "");
  if (mode.zero2sp.has(zero)) {
    combines.push([mode.zero2sp.get(zero) ?? "", ""]);
  }

  return combines;
}
