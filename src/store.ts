import { defineStore } from "pinia";
import { PresetConfigs, ShuangpinConfig } from "./utils/keyboard";
import rawArticles from "./utils/article.json";

declare global {
  type RawArticleName = keyof typeof rawArticles;
}

const cache: Record<string, ShuangpinConfig> = {};
const WINDOW_SIZE = 50;
export const useStore = defineStore("app", {
  state: (): AppState => {
    return {
      currentLeadIndex: 0,
      currentFollowIndex: 0,
      currentProgressiveIndex: 0,
      currentArticleIndex: 0,
      progresses: {},
      localConfigs: {},

      combines: [],
      articles: [],
      settings: {
        enableAutoClear: true,
        enableKeyHint: true,
        enablePinyinHint: true,
        theme: "auto",
        shuangpinMode: "小鹤双拼",
        targetSpeed: 35,      
        targetAccuracy: 95, 
        fontSize: 28,
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
          history: [],
          correctSum: 0,
        };
      }
      return this.progresses[name];
    },
    updateProgress(name: string, progress: Progress) {
      this.progresses[name] = progress;
    },
    updateProgressOnValid(lead: string, follow: string, isValid: boolean) {
      const value = isValid ? 1 : 0;

      for (const name of [lead, follow, lead + follow]) {
        const progress = this.getProgress(name);

        progress.history.push(value);
        progress.correctSum += value;

        if (progress.history.length > WINDOW_SIZE) {
          const removedValue = progress.history.shift()!;
          progress.correctSum -= removedValue; 
        }

        progress.total += 1;
      }
    },
    getAccuracy(name: string) {
      const progress = this.progresses[name];
      if (!progress || progress.history.length === 0) return 0;
      return progress.correctSum / progress.history.length;
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
      if (this.modes.includes(name)) {
        name += " 副本";
      }
      this.localConfigs[name] = config;
    },
    deleteConfig(name: string) {
      delete this.localConfigs[name];
    },
    getAllConfigs() {
      this.modes.forEach((mode) => this.loadConfig(mode));
    },
    loadConfig(name: string) {
      if (this.localConfigs[name]) {
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
