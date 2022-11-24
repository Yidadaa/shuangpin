import { describe, test, expect } from "vitest";
import { map, shortText } from "../common";

describe("积类型映射", () => {
  test("Record<string, number> -> Record<string, string>", () => {
    const testCase = {
      a: 1,
      b: 2,
    };

    expect(map(testCase, (a, b) => [a, b.toString()])).toMatchObject({
      a: "1",
      b: "2",
    });
  });
});

describe("文本溢出省略 shortText", () => {
  test("maxLength = 0, expect empty string", () => {
    expect(shortText("abc", 0)).toBe("");
  });

  test("input = 'abcd', maxLength = 4, expect 'abcd'", () => {
    expect(shortText("abcd", 4)).toBe("abcd");
  });

  test("input = 'abcd', maxLength = 3, expect 'a...'", () => {
    expect(shortText("abcd", 3)).toBe("a...");
  });
});
