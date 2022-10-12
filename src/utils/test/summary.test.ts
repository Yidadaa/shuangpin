import { describe, test, expect } from "vitest";
import {
  AchievementCond,
  achievementConds,
  finalAchievement,
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
