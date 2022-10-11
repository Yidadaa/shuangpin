/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare type Char =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z"
  | ";";

type Pinyin = { lead: string; follow: string; full: string };

interface Progress {
  currentIndex: number = 0;
  total: number = 0;
  correctTry: number = 0;
  totalTry: number = 0;
}

interface Combine {
  lead: string;
  follow: string;
  hanzis: string[];
  progress: Progress;
}

type Article =
  | {
      type: RawArticleName;
      progress: Progress;
    }
  | {
      type: "CUSTOM";
      name: string;
      progress: Progress;
    };

interface KeyConfig {
  main: Char;
  leads: string[];
  follows: string[];
}

interface Settings {
  enableForceDark: boolean; // 强制深色
  enableKeyHint: boolean; // 按键提示
  enablePinyinHint: boolean; // 拼音提示
  enableAutoClear: boolean; // 自动清空
  shuangpinMode: ShuangpinType;
}

interface AppState {
  currentLeadIndex: number;
  currentFollowIndex: number;
  currentArticleIndex: number;
  progresses: Record<string, Progress>;
  localConfigs: Record<string, RawShuangPinConfig>;

  combines: Combine[];
  articles: Article[];
  settings: Settings;
}
