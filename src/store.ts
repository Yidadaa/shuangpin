import { defineStore } from "pinia";
import { loadShuangpinConfig } from "./utils/keyboard";
import rawArticles from "./utils/article.json";

declare global {
  type RawArticleName = keyof typeof rawArticles;
}

export const useStore = defineStore("app", {
  state: (): AppState => {
    return {
      currentLeadIndex: 0,
      currentFollowIndex: 0,
      currentArticleIndex: 0,

      combines: [],
      articles: [],
      settings: {
        enableAutoClear: true,
        enableKeyHint: true,
        enablePinyinHint: true,
        enableSeg: true,
        shuangpinMode: "小鹤双拼",
      },
    };
  },
  getters: {
    mode(state) {
      return loadShuangpinConfig(state.settings.shuangpinMode);
    },
  },
  persist: true,
});
