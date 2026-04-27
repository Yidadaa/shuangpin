import { getPinyinOf } from "./hanzi";
import { matchSpToPinyin, type ShuangpinConfig } from "./keyboard";
import { getXhyxInfo } from "./xhyx";

export interface PracticePrompt {
  scheme: PracticeScheme;
  answers: string[];
  inputLength: number;
  hintKeys: string[];
  displayHint: string;
  detailHint: string;
  pinyins: string[];
}

function uniq<T>(items: T[]) {
  return [...new Set(items)];
}

export function buildPracticePrompt(
  hanzi: string,
  scheme: PracticeScheme,
  mode: ShuangpinConfig
): PracticePrompt {
  const pinyins = uniq(getPinyinOf(hanzi));

  if (scheme === "xhyx") {
    const info = getXhyxInfo(hanzi);
    const answers = info?.codes ?? [];

    return {
      scheme,
      answers,
      inputLength: 4,
      hintKeys: answers[0]?.split("") ?? [],
      displayHint: answers
        .map((code) => `${code.slice(0, 2).toUpperCase()} ${code.slice(2).toUpperCase()}`)
        .join(" / "),
      detailHint: info?.shape ?? "",
      pinyins,
    };
  }

  const answers = uniq(
    pinyins
      .map((pinyin) => mode.py2sp.get(pinyin) ?? "")
      .filter((code) => code.length === 2)
  );

  return {
    scheme,
    answers,
    inputLength: 2,
    hintKeys: answers[0]?.split("") ?? [],
    displayHint: pinyins.join("/").toUpperCase(),
    detailHint: pinyins[0] ?? "",
    pinyins,
  };
}

export function matchPracticeInput(
  seq: string[],
  prompt: PracticePrompt,
  mode: ShuangpinConfig
): InputMatchResult {
  if (prompt.scheme === "xhyx") {
    const code = seq.join("");
    const valid = prompt.answers.includes(code);
    return {
      valid,
      completed: seq.length >= prompt.inputLength,
      display: seq,
      progressKeys: valid ? [...seq, code] : undefined,
    };
  }

  const [lead, follow] = seq;
  let isValid = false;
  let display: string[] = [];
  let progressKeys: string[] | undefined;

  for (const answer of prompt.pinyins) {
    const res = matchSpToPinyin(
      mode,
      lead as Char,
      follow as Char,
      answer
    );
    display = [res.lead, res.follow].filter((v) => !!v);

    if (lead && follow && res.valid) {
      progressKeys = [res.lead, res.follow, res.lead + res.follow];
      isValid = true;
      break;
    }
  }

  return {
    valid: isValid,
    completed: seq.length >= prompt.inputLength,
    display,
    progressKeys,
  };
}
