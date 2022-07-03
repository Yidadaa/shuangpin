import configs from "./spconfig.json";

function loadShuangpinConfig(name: keyof typeof configs) {
  const config = configs[name];
  const keys: ShuangpinMode["keys"] = new Map();

  for (const line of config) {
    for (const rawKey of line) {
      const [main, follow, lead] = rawKey.split("/");

      keys.set(main as Char, {
        main: main as Char,
        follows: follow.split(","),
        leads: lead.split(","),
      });
    }
  }
}

export const keyboardLayout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
