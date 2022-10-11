import { defineStore } from "pinia";
import { PresetConfigs, ShuangpinConfig } from "./utils/keyboard";
import rawArticles from "./utils/article.json";

declare global {
  type RawArticleName = keyof typeof rawArticles;
}

const cache: Record<string, ShuangpinConfig> = {};

export const useStore = defineStore("app", {
  state: (): AppState => {
    return {
      currentLeadIndex: 0,
      currentFollowIndex: 0,
      currentArticleIndex: 0,
      progresses: {},
      localConfigs: {},

      combines: [],
      articles: [],
      settings: {
        enableAutoClear: true,
        enableKeyHint: true,
        enablePinyinHint: true,
        enableForceDark: false,
        shuangpinMode: "小鹤双拼",
      },
    };
  },
  getters: {
    modes(state) {
      return Object.keys(PresetConfigs).concat(Object.keys(state.localConfigs));
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
    updateProgressOnValid(lead: string, follow: string, isValid: boolean) {
      for (const name of [lead, follow, lead + follow]) {
        const progress = this.getProgress(name);
        progress.correctTry += Number(isValid);
        progress.totalTry += 1;
        this.updateProgress(name, progress);
      }
    },
    getAccuracy(name: string) {
      const progress = this.getProgress(name);
      if (progress.correctTry === 0) return 0;
      return progress.correctTry / progress.totalTry;
    },

    mode() {
      const name = this.$state.settings.shuangpinMode;
      if (!cache[name]) {
        const config = this.loadConfig(name);
        cache[config.name] = config;
        if (name !== config.name) {
          this.$state.settings.shuangpinMode = name;
        }
      }
      return cache[name];
    },

    // 配置文件
    saveConfig(name: string, config: RawShuangPinConfig) {
      if (name in this.localConfigs) {
        name += " 副本";
      }
      this.localConfigs[name] = config;
    },
    deleteConfig(name: string) {
      delete this.localConfigs[name];
    },
    getAllConfigs() {
      this.modes.map(this.loadConfig.bind(this));
    },
    loadConfig(name: string) {
      if (!!this.localConfigs[name]) {
        return new ShuangpinConfig(name, this.localConfigs[name], true);
      }
      if (!PresetConfigs[name as ShuangpinType]) {
        name = Object.keys(PresetConfigs)[0];
      }
      return new ShuangpinConfig(name, PresetConfigs[name as ShuangpinType]);
    },
  },
  persist: true,
});
