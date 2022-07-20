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
      progresses: {},

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
  actions: {
    getProgress(name: string) {
      if (!this.progresses[name]) {
        this.progresses[name] = {
          currentIndex: 0,
          total: 0,
          correctTry: 0,
          totalTry: 0,
        };
      }
      return this.progresses[name];
    },
    updateProgress(name: string, progress: Progress) {
      this.progresses[name] = progress;
    },
    getAccuracy(name: string) {
      const progress = this.getProgress(name);
      if (progress.correctTry === 0) return 0;
      return progress.correctTry / progress.totalTry;
    },
  },
  persist: true,
});
