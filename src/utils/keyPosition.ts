import { courseDisplays, paragraphCourseIndexs } from "./courseConfig.gen";
import type { ShuangpinConfig } from "./keyboard";
import type { Phoneme, PhonemeInputStatus } from "./phoneme";

export const resultMap = {
    curt_0: "finished-wrong",
    curt_1: "finished-correct",
    next: "activate",
} as const satisfies Record<string, PhonemeInputStatus>;
export const punctuationMapper: Record<string, string> = {
    "；": ";",
    "。": ".",
    "，": ",",
};
export const passRequire = 0.9;
export const perFragmentLength = 16;
export const currentMenuChangeKeys = ["PageUp", "PageDown"] as const;
const mainMenuChangeKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
] as const;
export const allMenuChangeKeys = [...currentMenuChangeKeys, ...mainMenuChangeKeys];

export type CharModeType = 'leads' | 'follows';
function getCharMode(isParagraphCourse: boolean, nextLead: boolean, _mode?: CharModeType): CharModeType {
    if (isParagraphCourse) {
        return nextLead
            ? "leads"
            : "follows";
    } else {
        return _mode ?? "follows";
    }
}

const vowelKeys = ['a', 'e', 'i', 'o', 'u']

type Params = {
    isParagraphCourse: boolean;
    nextLead: { value: boolean };
    config: ShuangpinConfig;
    menuIndex: number;
    _mode?: CharModeType;
}
const createPhoneme = ({ isParagraphCourse, nextLead, config, menuIndex, _mode }: Params) => (char: string, i: number): Phoneme | undefined => {
    const mode = getCharMode(isParagraphCourse, nextLead.value, _mode);
    const status: PhonemeInputStatus = i === 0 ? "activate" : "unfinished";
    const phonemeValues = config.groupByKey.get(char as Char)?.[mode];
    const values = phonemeValues?.length ? phonemeValues : [char];

    if (mode === 'leads' && vowelKeys.includes(char) && !phonemeValues?.[0]) {
        return;
    }

    let displayValue: string;
    if (isParagraphCourse) {
        if (phonemeValues) {
            nextLead.value = !nextLead.value;
        }
        displayValue = courseDisplays[paragraphCourseIndexs.indexOf(menuIndex)][i]
    } else {
        const fragmentIndex = Math.floor(i / perFragmentLength);
        const charIndex = fragmentIndex % values.length;
        displayValue = values[charIndex];
    }

    return { status, displayValue, values, char };
}

export function createWholeSeq(chars: readonly string[], config: ShuangpinConfig, menuIndex: number, _mode?: 'leads' | 'follows'): Phoneme[] {
    const isParagraphCourse = paragraphCourseIndexs.includes(menuIndex);
    const nextLead = { value: true };
    return chars.map(createPhoneme({ isParagraphCourse, nextLead, config, menuIndex, _mode })).filter((p): p is Phoneme => p !== undefined);
}
