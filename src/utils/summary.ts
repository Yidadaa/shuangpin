export class TypingSummary {
  private readonly WINDOW_SIZE = 50;
  private history: Array<{
    result: boolean;
    duration: number;
    presses: number;
  }> = [];

  private lastTime = 0;
  private currentTermPresses = 0;

  public totalPressCount = 0;
  public totalCorrectMatches = 0;
  public totalValidMatches = 0;

  onKeyPressed() {
    this.totalPressCount += 1;
    this.currentTermPresses += 1;

    const now = performance.now();
    if (this.lastTime === 0) {
      this.lastTime = now;
    }
  }

  onValid(result: boolean) {
    this.totalValidMatches += 1;
    if (result) this.totalCorrectMatches += 1;

    const now = performance.now();
    let diff = now - this.lastTime;

    if (diff > 5000 || this.lastTime === 0) {
      diff = 0;
    }

    this.history.push({
      result,
      duration: diff,
      presses: this.currentTermPresses,
    });

    if (this.history.length > this.WINDOW_SIZE) {
      this.history.shift();
    }

    this.lastTime = now;
    this.currentTermPresses = 0;
  }

  get slidingAccuracy() {
    if (this.history.length === 0) return 0;
    const correctCount = this.history.filter((h) => h.result).length;
    return correctCount / this.history.length;
  }

  get hanziPerMinutes() {
    const totalDuration = this.history.reduce((sum, h) => sum + h.duration, 0);
    const totalCorrect = this.history.filter((h) => h.result).length;

    if (totalDuration === 0 || totalCorrect === 0) return 0;
    return (totalCorrect / totalDuration) * 1000 * 60;
  }

  get pressPerHanzi() {
    const correctItems = this.history.filter((h) => h.result);
    if (correctItems.length === 0) return 0;

    const windowPresses = correctItems.reduce((sum, h) => sum + h.presses, 0);
    return windowPresses / correctItems.length;
  }

  get totalAccuracy() {
    return this.totalValidMatches === 0
      ? 0
      : this.totalCorrectMatches / this.totalValidMatches;
  }
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
