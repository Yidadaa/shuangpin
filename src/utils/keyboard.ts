import { download } from "./common";
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
  type RawShuangPinConfig = (typeof configs)["小鹤双拼"];
  type ShuangpinMode = ShuangpinConfig;
}

export function encodeShuangpin() {}

export interface KeyBinding {
  main: string;
  leads: string[];
  follows: string[];
}

export class ShuangpinConfig {
  private readonly leadToKey = new Map<string, string>();
  private readonly followToKey = new Map<string, string>();
  private readonly zeroMap = new Map<string, string>();
  public readonly py2sp = new Map<string, string>();
  public groupByKey = new Map<string, any>();

  constructor(
    public name: string,
    public config: RawShuangPinConfig,
    public custom = false,
  ) {
    this.init();
  }

  private init() {
    const normalize = (s: string) => s.replaceAll("v", "ü");

    for (const line of this.config.keyMap) {
      const [key, followStr, leadStr] = line.split("/");
      const follows = followStr ? followStr.split(",").map(normalize) : [];
      const leads = leadStr ? leadStr.split(",") : [];

      this.groupByKey.set(key, { main: key, leads, follows });

      leads.forEach((l) => this.leadToKey.set(l, key));
      follows.forEach((f) => this.followToKey.set(f, key));
    }

    for (const line of this.config.zeroMap) {
      const [sp, py] = line.split("/");
      const normalizedPy = normalize(py);
      this.zeroMap.set(normalizedPy, sp);
      this.py2sp.set(normalizedPy, sp);
    }

    this.leadToKey.forEach((smKey, sm) => {
      this.followToKey.forEach((ymKey, ym) => {
        const pinyin = sm + ym;
        const sp = smKey + ymKey;
        this.py2sp.set(pinyin, sp);
      });
    });

    ["zh", "ch", "sh", "r"].forEach(sm => {
      const smKey = this.leadToKey.get(sm);
      const ymKey = this.followToKey.get("i");
      if (smKey && ymKey) {
        this.py2sp.set(sm, smKey + ymKey);
        this.py2sp.set(sm + "i", smKey + ymKey);
      }
    });
  }
  get zero2sp(): Map<string, string> {
    return this.py2sp;
  }

  getSp(py: string): string | null {
    const normalizedPy = py.replaceAll("v", "ü");

    if (this.zeroMap.has(normalizedPy)) {
      return this.zeroMap.get(normalizedPy)!;
    }

    const match = new RegExp(/^(zh|ch|sh|[bpmfdtnlgkhjqxrwyzsc])/).exec(
      normalizedPy,
    );
    if (!match) return null;

    const sm = match[0];
    let ym = normalizedPy.slice(sm.length);
    if (ym === "" && ["zh", "ch", "sh", "r"].includes(sm)) {
      ym = "i";
    }

    const smKey = this.leadToKey.get(sm);
    const ymKey = this.followToKey.get(ym);

    return smKey && ymKey ? smKey + ymKey : null;
  }

  getStandardAnswers(pinyins: string[]): string[] {
    const answers = pinyins
      .map((py) => this.getSp(py))
      .filter((sp): sp is string => !!sp);
    return Array.from(new Set(answers));
  }

  download() {
    download(this.name, JSON.stringify(this.config));
  }
}

export const keyboardLayout = ["qwertyuiop", "asdfghjkl;", "zxcvbnm"];

export function mergeString(list: string[] = []): string {
  if (list.length === 0) return "";
  const unique = Array.from(new Set(list));
  if (unique.length <= 2) return unique.join("/");
  return unique.slice(0, 3).join("/") + (unique.length > 3 ? "..." : "");
}

export function mapConfigToLayout(config: ShuangpinMode) {
  return keyboardLayout.map((row) =>
    row.split("").map((key) => {
      const keyConfig: KeyBinding = config.groupByKey.get(key) ?? {
        main: key,
        leads: [],
        follows: [],
      };

      return {
        main: keyConfig.main,
        lead: mergeString(
          keyConfig.leads.filter((v: string) => v !== keyConfig.main),
        ),
        follow: mergeString(keyConfig.follows),
        leads: keyConfig.leads,
        follows: keyConfig.follows,
      };
    }),
  );
}

export function matchSpToPinyin(
  mode: ShuangpinConfig,
  leadKey: string,
  followKey: string,
  targetPinyin: string,
) {
  const sp = (leadKey ?? "") + (followKey ?? "");
  const standardAnswers = mode.getStandardAnswers([targetPinyin]);
  const isValid = !!leadKey && !!followKey && standardAnswers.includes(sp);
  let lead = leadKey;
  let follow = followKey;

  if (isValid) {
    if (mode.py2sp.get(targetPinyin) === sp) {
      const match = /^(zh|ch|sh|[bpmfdtnlgkhjqxrwyzsc])/.exec(targetPinyin.replaceAll("v", "ü"));
      if (match) {
        lead = match[0];
        follow = targetPinyin.slice(lead.length);
      } else {
        lead = "〇";
        follow = targetPinyin;
      }
    }
  } else {
    const leadConfig = mode.groupByKey.get(leadKey);
    const followConfig = mode.groupByKey.get(followKey);
    
    if (leadConfig?.leads?.length) lead = leadConfig.leads[0];
    if (followConfig?.follows?.length) follow = followConfig.follows[0];
  }

  return {
    valid: isValid,
    lead: lead,
    follow: follow,
  };
}

export { default as PresetConfigs } from "./spconfig.json";
