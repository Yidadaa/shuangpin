import configs from "./spconfig.json";

declare global {
  type ShuangpinType = keyof typeof configs;
}

export const shuangpins = Object.keys(configs) as [ShuangpinType];

export function loadShuangpinConfig(name: ShuangpinType) {
  const config = configs[name];
  const keys: ShuangpinMode["keys"] = new Map();

  for (const line of config) {
    for (const rawKey of line) {
      const [main, follow, lead] = rawKey.split("/");

      keys.set(main as Char, {
        main: main as Char,
        follows: follow.split(","),
        leads: lead?.split(","),
      });
    }
  }

  return keys;
}

export const keyboardLayout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
