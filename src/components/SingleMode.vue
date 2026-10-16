<script setup lang="ts">
import Keyboard from "../components/Keyboard.vue";
import Hanzi from "../components/Hanzi.vue";
import Pinyin from "../components/Pinyin.vue";
import TypeSummary from "../components/TypeSummary.vue";
import MenuList from "../components/MenuList.vue";

import { onActivated, onDeactivated, ref, watch } from "vue";
import { matchSpToPinyin } from "../utils/keyboard";
import { playFeedback, speakHanzi, stopAudio } from "../utils/audio";
import { useStore } from "../store";
import { computed } from "vue";
import { getPinyinOf } from "../utils/hanzi";
import { TypingSummary } from "../utils/summary";
import { followKeys, leadKeys } from "../utils/pinyin";
import { randInt, randomChoice } from "../utils/number";

export interface SingleModeProps {
  nextChar?: () => string;
  hanziList?: string[];
  onValidInput?: (result: boolean) => void;
  mode?: "Lead" | "Follow";
}

function nextChar() {
  if (!props.mode) {
    return props.nextChar?.() ?? "";
  }
  return props.hanziList?.[randInt(props.hanziList?.length)] ?? "";
}

const pinyin = ref<string[]>([]);

const store = useStore();
const props = defineProps<SingleModeProps>();
const hanziSeq = ref<string[]>([]);
const isValid = ref(false);

/** 当前组件是否处于 keep-alive 激活状态。 */
const isActive = ref(false);

/** 用当前来源重建队列（4 个预览字 + 末尾目标）。 */
function rebuildQueue() {
  hanziSeq.value = new Array(4).fill(0).map(() => nextChar());
}

rebuildQueue();

const summary = ref(new TypingSummary());

const keys = {
  Lead: leadKeys,
  Follow: followKeys,
  "": [] as string[],
}[props.mode ?? ""];

const progresses = computed(() =>
  keys.map((v) => {
    return {
      key: v,
      progress: store.getProgress(v),
    };
  })
);

const listMenuItems = computed(() => {
  return progresses.value.map(
    (v) =>
      `${v.key.toUpperCase()} ${(store.getAccuracy(v.key) * 100).toFixed(2)}%`
  );
});

const menuIndex = computed(() => {
  if (props.mode === "Lead") {
    return store.currentLeadIndex;
  } else if (props.mode === "Follow") {
    return store.currentFollowIndex;
  }
  return -1;
});

function onMenuChange(i: number) {
  if (props.mode === "Lead") {
    store.currentLeadIndex = i;
  } else if (props.mode === "Follow") {
    store.currentFollowIndex = i;
  }
}

/**
 * 只监听真正需要重建队列的来源：Lead/Follow 的字表（菜单切换导致
 * hanziList 变化时重建并朗读一次）。Random 无字表，来源恒为 undefined，
 * 不会触发；也不再监听 hanziSeq 自身，advance 的单次 unshift/pop 不会
 * 被再次重洗。
 */
watch(
  () => props.hanziList,
  () => {
    rebuildQueue();
    if (isActive.value) {
      speakCurrent();
    }
  }
);

function onKeyPressed() {
  summary.value.onKeyPressed();
}

onActivated(() => {
  isActive.value = true;
  document.addEventListener("keypress", onKeyPressed);
  speakCurrent();
});

onDeactivated(() => {
  isActive.value = false;
  document.removeEventListener("keypress", onKeyPressed);
  clearAdvanceTimer();
  stopAudio();
});

/**
 * 当前目标字的全部去重读音；完整提交时逐一匹配，任一命中即正确。
 */
const answers = computed(() => {
  const pys = getPinyinOf(hanziSeq.value.at(-1) ?? "");
  return [...new Set(pys)];
});

const answer = computed(() => answers.value.at(0) ?? "");

const hints = computed(() => {
  return (store.mode().py2sp.get(answer.value) ?? "").split("");
});

/**
 * 对当前字全部去重读音逐一匹配；任一命中即返回该结果，
 * 全部未命中时返回最后一次匹配结果（用于展示 lead/follow）。
 */
function matchAnswers(lead: string, follow: string) {
  let last: ReturnType<typeof matchSpToPinyin> | null = null;
  for (const py of answers.value) {
    const res = matchSpToPinyin(store.mode(), lead as Char, follow as Char, py);
    if (res.valid) {
      return res;
    }
    last = res;
  }
  return last ?? { valid: false, lead, follow };
}

function onSeq([lead, follow]: [string?, string?]) {
  const fullInput = !!lead && !!follow;

  // CP-11：100ms 推进窗口内的任何输入（含单键）一律吞掉——return true
  // 让 Keyboard 清空缓冲；不反馈、不统计、不改变 pinyin/推进，避免残留。
  if (advanceTimer !== null) {
    return true;
  }

  // 完整提交按全部读音逐一匹配（任一命中即正确）；单键输入沿用
  // 第一个读音做提示性匹配（与 hints 一致）。
  const res = fullInput
    ? matchAnswers(lead ?? "", follow ?? "")
    : matchSpToPinyin(store.mode(), lead as Char, follow as Char, answer.value);

  if (fullInput) {
    props.onValidInput?.(res.valid);
    store.updateProgressOnValid(res.lead, res.follow, res.valid);
    summary.value.onValid(res.valid);
  }

  pinyin.value = [res.lead, res.follow].filter((v) => !!v) as string[];

  isValid.value = res.valid;

  if (fullInput) {
    if (store.settings.enableSoundFeedback) {
      playFeedback(res.valid ? "correct" : "incorrect");
    }

    if (res.valid) {
      scheduleAdvance();
    }
  }

  return res.valid;
}

/** 尚未执行的推进定时器；停用页面时清除，避免停用后仍切字/朗读。 */
let advanceTimer: ReturnType<typeof setTimeout> | null = null;

function clearAdvanceTimer() {
  if (advanceTimer !== null) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

/** 朗读指定字（遵守发音设置）；空字不读。 */
function speakTarget(target: string) {
  if (!store.settings.enablePronunciation) {
    return;
  }
  if (target === "") {
    return;
  }
  speakHanzi(target);
}

/** 朗读当前目标字（hanziSeq 末尾），不朗读预览队列。 */
function speakCurrent() {
  speakTarget(hanziSeq.value.at(-1) ?? "");
}

/** 正确输入后延迟 100ms 推进到新字，并朗读新目标一次。 */
function advance() {
  hanziSeq.value.unshift(nextChar());
  hanziSeq.value.pop();
  // 先取定新目标再朗读，保证朗读字与最终显示 at(-1) 一致。
  const target = hanziSeq.value.at(-1) ?? "";
  pinyin.value = [];
  isValid.value = false;
  speakTarget(target);
}

function scheduleAdvance() {
  clearAdvanceTimer();
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    advance();
  }, 100);
}
</script>

<template>
  <div class="home-page">
    <div class="single-menu">
      <menu-list
        :items="listMenuItems"
        :index="menuIndex"
        @menu-change="onMenuChange"
      />
    </div>

    <div class="input-area">
      <Pinyin :chars="pinyin" />
    </div>

    <div class="hanzi-list">
      <Hanzi :hanzi-seq="[...hanziSeq]" />
    </div>

    <div class="single-keyboard">
      <Keyboard :valid-seq="onSeq" :hints="hints" />
    </div>

    <div class="summary">
      <TypeSummary
        :speed="summary.hanziPerMinutes"
        :accuracy="summary.accuracy"
        :avgpress="summary.pressPerHanzi"
      />
    </div>
  </div>
</template>

<style lang="less">
@import "../styles/color.less";
@import "../styles/var.less";

.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;

  .single-menu {
    position: absolute;
    top: 0;
    left: 100px;
  }

  .input-area {
    margin-bottom: 32px;
    height: 160px;
    display: flex;
    align-items: center;

    @media (max-width: 576px) {
      margin-top: 30vh;
    }
  }

  .summary {
    position: absolute;
    right: var(--app-padding);
    bottom: var(--app-padding);

    @media (max-width: 576px) {
      top: 36px;
    }
  }

  .hanzi-list {
    position: absolute;
    top: var(--app-padding);
    right: var(--app-padding);

    @media (max-width: 576px) {
      top: 120px;
    }
  }

  @media (max-width: 576px) {
    .single-keyboard {
      position: absolute;
      bottom: 1em;
    }
  }
}
</style>
