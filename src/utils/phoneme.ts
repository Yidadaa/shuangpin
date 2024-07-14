import type { CharModeType } from "./keyPosition";

export type PhonemeInputStatus =
    | "activate"
    | "activate-correct"
    | "activate-wrong"
    | "finished-correct"
    | "finished-wrong"
    | "unfinished";

export type Phoneme = {
    values: string[]
    displayValue: string;
    char: string;
    status: PhonemeInputStatus;
};

export interface KeyPracticeProps {
    mode?: CharModeType;
}
