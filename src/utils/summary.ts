export class TypingSummary {
  constructor() {}

  onKeyPressed() {
    this.pressCount += 1;

    this.accumTime();
  }

  onValid(result: boolean) {
    this.totalValid += 1;
    this.totalCorrect += Number(result);
  }

  /**
   * 击键间隔大于 5s，不收集时间
   */
  private accumTime() {
    const time = performance.now();
    const diff = time - this.lastTime;

    if (diff < 5000) {
      this.totalTime += diff;
    }
    this.lastTime = time;
  }

  get hanziPerMinutes() {
    if (this.totalTime === 0) return 0;
    return (this.totalCorrect / this.totalTime) * 1000 * 60;
  }

  get pressPerHanzi() {
    if (this.totalCorrect === 0) return 0;
    return this.pressCount / this.totalCorrect;
  }

  get accuracy() {
    if (this.totalValid === 0) return 0;
    return this.totalCorrect / this.totalValid;
  }

  private lastTime = 0;
  private pressCount = 0;
  private totalTime = 0;
  private totalValid = 0;
  private totalCorrect = 0;
}

export type AchievementCond =
  | "correctMatches"
  | "bestCombos"
  | "bestAccuracy"
  | "bestHPW"
  | "bestWPM";

export const lowerIsBetter = new Set<AchievementCond>(["bestHPW"]);
export const achievementConds: Record<
  AchievementCond,
  Record<number, string>
> = {
  correctMatches: {
    1: "你好双拼",
    10: "整挺好",
    100: "小试牛刀",
    1000: "渐入佳境",
    5000: "小有所成",
    10000: "轻车熟路",
    20000: "真正的粉丝",
    50000: "学无止境",
  },
  bestCombos: {
    17: "格洛克",
    30: "突击手",
    42: "终极答案",
    100: "精准制导",
    238: "铀",
  },
  bestAccuracy: {
    50: "日取其半",
    60: "及格了",
    75: "中坚力量",
    85: "尖子生",
    90: "开悟之坡",
    95: "平流层",
    99: "就差一点",
    100: "完美主义",
  },
  bestWPM: {
    10: "一指禅",
    20: "二指禅",
    40: "四平八稳",
    60: "顺溜",
    80: "指尖飞舞",
    100: "无情铁手",
    120: "芝加哥打字机",
    160: "我是传奇",
    200: "我是人类",
  },
  bestHPW: {
    3.0: "驯服手指",
    2.8: "手眼协调",
    2.5: "肌肉记忆",
    2.3: "精准点射",
    2.1: "狙击手",
    2.0: "复印机",
  },
};
export const finalAchievement: Record<
  string,
  { [k in AchievementCond]?: number }
> = {
  初级双拼认证: {
    correctMatches: 1000,
    bestAccuracy: 75,
  },
  中级双拼认证: {
    correctMatches: 1000,
    bestAccuracy: 90,
  },
  高级双拼认证: {
    correctMatches: 1000,
    bestAccuracy: 95,
  },
  双拼大师: {
    correctMatches: 1000,
    bestAccuracy: 99,
    bestHPW: 2.1,
    bestWPM: 120,
  },
};

export class Achievement {
  hits = 0; // 击键次数
  totalMatches = 0; // 总匹配次数
  correctMatches = 0; // 成功匹配次数
  bestCombos = 0; // 最佳连击次数
  bestAccuracy = 1; // 最佳准确率
  bestWPM = 0; // 最佳字每分
  bestHPM = 0; // 最佳码长

  currentCombos = 0; // 当前连击次数
  currentAccuracy = 1; // 当前准确率
  currentWPM = 0; // 当前字每分
  currentHPW = 0; // 当前码长

  check() {}
}
