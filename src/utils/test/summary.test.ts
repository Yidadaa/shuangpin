import { describe, test, expect, vi, it, beforeEach } from "vitest";
import {
  AchievementCond,
  achievementConds,
  finalAchievement,
  TypeSummary,
  TypingProgress,
} from "../summary";

describe("成就系统", () => {
  test("综合认证条件有效", () => {
    for (const [name, conds] of Object.entries(finalAchievement)) {
      for (const [condName, cond] of Object.entries(conds) as Iterable<
        [AchievementCond, number]
      >) {
        const prefix = `${name}: cond ${condName} has ${cond}`;
        expect(achievementConds[condName][cond] ? true : prefix).toBe(true);
      }
    }
  });
});

describe("输入统计", () => {
  let summary: TypeSummary;

  beforeEach(() => {
    summary = new TypeSummary();
  });

  describe("正常输入", () => {
    it("初始情况", () => {
      expect(summary.hanziPerMinutes).toBe(0);
      expect(summary.pressPerHanzi).toBe(0);
      expect(summary.accuracy).toBe(1);
    });
    it("应当跳过首次闲置时间", () => {
      summary.onKeyPressed();

      expect(summary.hanziPerMinutes).toBe(0);
      expect(summary.pressPerHanzi).toBe(0);
      expect(summary.accuracy).toBe(1);
    });
    it.each([
      [
        "输入一个正确字符",
        { currentCorrectCount: 1, currentInputCount: 1 },
        { hanziPerMinutes: 60, pressPerHanzi: 2, accuracy: 1 },
      ],
      [
        "输入两个正确字符",
        { currentCorrectCount: 2, currentInputCount: 2 },
        { hanziPerMinutes: 120, pressPerHanzi: 1, accuracy: 1 },
      ],
      [
        "输入一个错误字符",
        { currentCorrectCount: 0, currentInputCount: 1 },
        { hanziPerMinutes: 0, pressPerHanzi: 0, accuracy: 0 },
      ],
      [
        "输入两个错误字符",
        { currentCorrectCount: 0, currentInputCount: 2 },
        { hanziPerMinutes: 0, pressPerHanzi: 0, accuracy: 0 },
      ],
    ] as [string, TypingProgress, Pick<TypeSummary, "hanziPerMinutes" | "pressPerHanzi" | "accuracy">][])(
      "一秒内击键两次，%s",
      (_, progress, expected) => {
        vi.spyOn(performance, "now").mockReturnValue(1000);
        summary.onKeyPressed();
        summary.update(progress);
        vi.spyOn(performance, "now").mockReturnValue(2000);
        summary.onKeyPressed();

        expect(summary.hanziPerMinutes).toBe(expected.hanziPerMinutes);
        expect(summary.pressPerHanzi).toBe(expected.pressPerHanzi);
        expect(summary.accuracy).toBe(expected.accuracy);
      }
    );
  });

  describe("暂停时间过长", () => {
    it("两秒内击键三次，正常记录耗时", () => {
      vi.spyOn(performance, "now").mockReturnValue(1000);
      summary.onKeyPressed();
      vi.spyOn(performance, "now").mockReturnValue(2000);
      summary.onKeyPressed();
      vi.spyOn(performance, "now").mockReturnValue(3000);
      summary.onKeyPressed();
      summary.update({ currentCorrectCount: 1, currentInputCount: 1 });

      expect(summary.hanziPerMinutes).toBe(30);
      expect(summary.pressPerHanzi).toBe(3);
      expect(summary.accuracy).toBe(1);
    });
    it("两秒内击键三次，但最后一次暂停 5s 以上，则不记录最后一次间隔", () => {
      vi.spyOn(performance, "now").mockReturnValue(1000);
      summary.onKeyPressed();
      vi.spyOn(performance, "now").mockReturnValue(2000);
      summary.onKeyPressed();
      vi.spyOn(performance, "now").mockReturnValue(7001);
      summary.onKeyPressed();
      summary.update({ currentCorrectCount: 1, currentInputCount: 1 });

      // 相当于 1s 内击键 2 次，输入一个汉字
      expect(summary.hanziPerMinutes).toBe(10);
      expect(summary.pressPerHanzi).toBe(3);
      expect(summary.accuracy).toBe(1);
    });
  });
});
