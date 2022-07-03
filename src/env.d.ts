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
  | "z";

type Pinyin = { lead: string; follow: string };

interface Progress {
  currentIndex: number;
  total: number;
  correctTry: number;
  totalTry: number;
}

interface Combine {
  lead: string;
  follow: string;
  hanzis: string[];
  progress: Progress;
}

interface Article {
  text: string;
  name: string;
  progress: Progress;
}

interface KeyConfig {
  main: Char;
  leads: string[];
  follows: string[];
}

interface ShuangpinMode {
  name: ShuangpinType;
  keys: Map<Char, KeyConfig>;
}

interface Settings {
  enableSeg: boolean; // 分词键
  enableKeyHint: boolean; // 按键提示
  enablePinyinHint: boolean; // 拼音提示
  enableAutoClear: boolean; // 自动清空
  shuangpinMode: ShuangpinType;
}

interface AppState {
  combines: Combine[];
  artices: Article[];
  settings: Settings;
}
