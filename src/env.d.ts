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
  currentIndex: number;
  total: number;
  history: number[];
  correctSum: number;
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
  theme: Theme; // 主题
  enableKeyHint: boolean; // 按键提示
  enablePinyinHint: boolean; // 拼音提示
  enableAutoClear: boolean; // 自动清空
  shuangpinMode: ShuangpinType;
  targetSpeed: number;    // 目标速度 (WPM/KPM)
  targetAccuracy: number; // 目标准确率 (0-100)
  fontSize: number; // 默认值可以设为 28
}

type Theme = "auto" | "dark" | "light";

interface AppState {
  currentLeadIndex: number;
  currentFollowIndex: number;
  currentProgressiveIndex: number;
  currentArticleIndex: number;
  progresses: Record<string, Progress>;
  localConfigs: Record<string, RawShuangPinConfig>;

  combines: Combine[];
  articles: Article[];
  settings: Settings;
}
