import { Ref, ref, watch, shallowRef } from "vue";
import {
  progressiveKeys,
  leadKeys,
  followKeys,
  followMap,
} from "../utils/pinyin";
import { getHanziOf } from "../utils/hanzi";
import { shuffle } from "lodash-es";

function getActiveContext(idx: number) {
  const activeKeys = progressiveKeys.slice(0, idx + 1);
  const latestKey = progressiveKeys[idx];
  const activeLeads = new Set([
    ...activeKeys.filter((k) => leadKeys.includes(k)),
    "",
  ]);
  return { activeKeys, latestKey, activeLeads };
}

function pickTopCharacters(chars: string[], count: number): string[] {
  if (chars.length === 0) return [];
  return Array.from({ length: count }, (_, i) => chars[i % chars.length]);
}

const TOP_FREQ_CHARS_PER_PINYIN = 10;
function categorizeHanzi(idx: number) {
  const { activeKeys, latestKey, activeLeads } = getActiveContext(idx);
  const currentItems: string[] = [];
  const oldItems: string[] = [];

  const activeFollows = activeKeys.filter((k) => followKeys.includes(k));

  for (const fKey of activeFollows) {
    const list = followMap.get(fKey) ?? [];

    for (const p of list) {
      if (!activeLeads.has(p.lead)) continue;

      const charsSortedByFreq = getHanziOf(p.full);
      const sampled = pickTopCharacters(
        charsSortedByFreq,
        TOP_FREQ_CHARS_PER_PINYIN,
      );
      if (sampled.length === 0) continue;

      const isNew = p.lead === latestKey || p.follow === latestKey;
      (isNew ? currentItems : oldItems).push(...sampled);
    }
  }

  return { currentItems, oldItems };
}

const PREVIEW_LIST_SIZE = 10;
function interleaveLists(
  shuffledNew: string[],
  shuffledOld: string[],
  headerSize = PREVIEW_LIST_SIZE,
) {
  const previewSession = shuffledNew.slice(0, headerSize);
  const trainingPool = [];
  for (let i = 0; i < shuffledOld.length; i++) {
    const newChar = shuffledNew[i % shuffledNew.length];
    trainingPool.push(newChar, shuffledOld[i]);
  }
  const result = [...previewSession, ...shuffle(trainingPool)];
  return result;
}

export function useProgressiveLogic(currentProgressiveIndex: Ref<number>) {
  const currentIndex = ref(0);
  const hanziList = shallowRef<string[]>([]);

  const updateHanziList = () => {
    const idx = currentProgressiveIndex.value;
    if (idx < 0) {
      hanziList.value = [];
      return;
    }

    const { currentItems, oldItems } = categorizeHanzi(idx);
    hanziList.value = interleaveLists(shuffle(currentItems), shuffle(oldItems));
  };

  watch(
    currentProgressiveIndex,
    () => {
      currentIndex.value = 0;
      updateHanziList();
    },
    { immediate: true },
  );

  const getNextChar = () => {
    const loopStartIndex = PREVIEW_LIST_SIZE;

    const list = hanziList.value;
    if (list.length === 0) return "";

    const char = list[currentIndex.value];
    let nextIdx = currentIndex.value + 1;

    if (nextIdx >= list.length) {
      nextIdx = list.length > loopStartIndex ? loopStartIndex : 0;
    }

    currentIndex.value = nextIdx;
    return char;
  };

  return { hanziList, getNextChar, currentIndex };
}
