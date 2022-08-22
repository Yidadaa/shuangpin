import { product } from "./number";
import { validCombines } from "./pinyin";
import configs from "./spconfig.json";

declare global {
  type ShuangpinType = keyof typeof configs;
  type RawShuangPinConfig = typeof configs["小鹤双拼"];
}

// 维护本地配置索引
// TODO: 将这部分逻辑转移到 pinia 里面去做持久化
const LOCAL_CONFIG = "__sp_names_";
function loadLocalConfigs(): string[] {
  const names = localStorage.getItem(LOCAL_CONFIG);

  return JSON.parse(names ?? "[]");
}

function saveLocalConfigs(name: string) {
  const oldConfigs = new Set(loadLocalConfigs());
  oldConfigs.add(name);
  const encodedText = JSON.stringify([...oldConfigs]);
  localStorage.setItem(LOCAL_CONFIG, encodedText);
}

export const shuangpins = Object.keys(configs).concat(loadLocalConfigs()) as [
  ShuangpinType
];

const configName = (s: string) => "__sp_config_" + s;

/**
 * 加载双拼配置
 * @param name 自定义双拼名称
 * @returns
 */
export function loadConfig(name: string) {
  if (!!(configs as any)[name]) {
    return configs[name as ShuangpinType];
  }

  // 尝试加载本地双拼
  const localConfig = localStorage.getItem(configName(name));

  if (!localConfig) {
    return configs[shuangpins[0]];
  }

  return JSON.parse(localConfig) as RawShuangPinConfig;
}

export function saveConfig(name: string, config: RawShuangPinConfig) {
  localStorage.setItem(configName(name), JSON.stringify(config));
  saveLocalConfigs(name);
}

export function parseRawConfig(name: string, config: RawShuangPinConfig) {
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

/**
 * 加载双拼配置，原始的双拼配置文件如下所示：
 * ```ts
 * config = {
 *   keyMap: [ // 按键映射
 *    '${键盘按键小写字符}/${韵母1,韵母2...}/${声母1,声母2...}'
 *   ],
 *   zeroMap: [ // 零声母映射
 *     '${双拼按键}/${对应拼音}'
 *   ]
 * }
 * ```
 * @param name 双拼名称
 * @returns
 */
export function loadShuangpinConfig(name: ShuangpinType): ShuangpinMode {
  const config = loadConfig(name);

  console.log("load shuangpin", name, config, parseRawConfig(name, config));

  return parseRawConfig(name, config);
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
