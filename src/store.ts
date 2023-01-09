import { defineStore } from "pinia";
import { PresetConfigs, ShuangpinConfig } from "./utils/keyboard";
import PresetArticles from "./utils/article.json";
import { map } from "./utils/common";
import { nextValidHanziIndex } from "./utils/hanzi";
import { TypingSummary } from "./utils/summary";

const defaultAppState = {
  currentLeadIndex: 0,
  currentFollowIndex: 0,
  progresses: {} as Record<string, Progress>,

  // 用户自定义双拼配置
  localConfigs: {} as Record<string, RawShuangPinConfig>,

  // 用户自定义文章
  localArticles: {} as Record<string, string>,

  currentArticleIndex: 0,
  isEditingArticle: false,

  isFreeMode: true,

  // 输入统计
  summary: new TypingSummary(),

  settings: {
    enableAutoClear: true,
    enableKeyHint: true,
    enablePinyinHint: true,
    theme: "auto",
    shuangpinMode: "小鹤双拼",
  },
};

declare global {
  type RawArticleName = keyof typeof PresetArticles;
  type Article = {
    name: string;
    text: string;
    type: "CUSTOM" | "PRESET";
  };

  type AppState = typeof defaultAppState;
}

const cache: Record<string, ShuangpinConfig> = {};

function getOrCreateProgress(
  progresses: Record<string, Progress>,
  name: string
) {
  if (!progresses[name]) {
    progresses[name] = {
      currentIndex: 0,
      total: 0,
      correctTry: 0,
      totalTry: 0,
    };
  }
  return progresses[name];
}

export const useStore = defineStore("app", {
  state: (): AppState => {
    return defaultAppState;
  },
  getters: {
    modes(state) {
      return Object.keys(PresetConfigs).concat(Object.keys(state.localConfigs));
    },
    articles(state) {
      return {
        ...map(PresetArticles, (name, text) => [
          name,
          { name, text, type: "PRESET" },
        ]),
        ...map(state.localArticles, (name, text) => [
          name,
          { name, text, type: "CUSTOM" },
        ]),
      } as Record<string, Article>;
    },
    articleNames(state) {
      return Object.keys(PresetArticles).concat(
        Object.keys(state.localArticles)
      );
    },
    currentArticleName(): string {
      const name = this.articleNames[this.currentArticleIndex];
      return name;
    },
    currentArticle(): Article {
      const article = this.articles[this.currentArticleName];

      return article;
    },
    currentParagraphs(): string[] {
      const paragraphs = this.currentArticle.text.split("\n");

      return paragraphs;
    },
    currentParagraphIndex(): {
      paragraphIndex: number;
      textIndex: number;
    } {
      const ret = {
        paragraphIndex: 0, // 段落索引
        textIndex: 0, // 行内索引
      };

      let totalCount = 0;
      const currentTextIndex = this.currentArticleProgress.currentIndex;

      for (let i = 0; i < this.currentParagraphs.length; i += 1) {
        const textCount = this.currentParagraphs[i].length + 1;
        totalCount += textCount;
        if (totalCount > currentTextIndex) {
          ret.paragraphIndex = i;
          ret.textIndex = currentTextIndex - totalCount + textCount; // 这里需要减去缺少的末尾换行符
          break;
        }
      }

      return ret;
    },
    currentArticleProgress(state): Progress {
      const progress = getOrCreateProgress(
        state.progresses,
        this.currentArticleName
      );

      progress.total = this.currentArticle.text.length;
      progress.currentIndex = nextValidHanziIndex(
        this.currentArticle.text,
        progress.currentIndex
      );

      return progress;
    },
  },
  actions: {
    getProgress(name: string) {
      return getOrCreateProgress(this.progresses, name);
    },
    updateProgress(name: string, progress: Progress) {
      this.progresses[name] = progress;
    },
    updateProgressWithStep(progress: Progress, step = 1) {
      progress.currentIndex = nextValidHanziIndex(
        this.currentArticle.text,
        progress.currentIndex + step
      );

      if (progress.currentIndex >= progress.total) {
        progress.currentIndex = 0;
      }
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
      if (this.modes.includes(name)) {
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

    // 文章
    updateArticleProgress(step = 1) {
      const progress = this.currentArticleProgress;
      this.updateProgressWithStep(progress, step);
      this.updateProgress(this.currentArticleName, progress);
    },
    saveArticle(article: Article) {
      this.localArticles[article.name] = article.text;
    },
    deleteArticle(name: string) {
      delete this.localArticles[name];
      this.currentArticleIndex = Math.max(0, this.currentArticleIndex - 1);
    },
    resetSummary() {
      this.summary = new TypingSummary();
    },
  },
  persist: true,
});
