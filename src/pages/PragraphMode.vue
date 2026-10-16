<script setup lang="ts">
import Pinyin from "../components/Pinyin.vue";
import Keyboard from "../components/Keyboard.vue";
import TypeSummary from "../components/TypeSummary.vue";

import {
  ref,
  watchPostEffect,
  onActivated,
  onDeactivated,
  onMounted,
  watchEffect,
  watch,
} from "vue";
import { useStore } from "../store";
import { storeToRefs } from "pinia";

import rawArticles from "../utils/article.json";
import { computed } from "vue";
import { getPinyinOf, hanziMap } from "../utils/hanzi";
import { playFeedback, speakHanzi, stopAudio } from "../utils/audio";
import { matchSpToPinyin } from "../utils/keyboard";
import { TypingSummary } from "../utils/summary";
import MenuList from "../components/MenuList.vue";

const store = useStore();
const articles = storeToRefs(store).articles;
const settings = storeToRefs(store).settings;

const summary = ref(new TypingSummary());

// CP-12：长句练习接入当前汉字朗读。
// 推进定时器句柄（onDeactivated 时清除，避免停用后切字/朗读）。
let advanceTimer: ReturnType<typeof setTimeout> | null = null;
// 最近一次朗读的目标标识（文章名 + 有效下标），保证每个目标只朗读一次。
let lastSpokenKey = "";

function clearAdvanceTimer() {
  if (advanceTimer !== null) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

/** 朗读当前下划线汉字；force 用于激活/返回页面时强制朗读当前目标。 */
function speakCurrentHanzi(force = false) {
  if (!settings.value.enablePronunciation) return;
  if (isEditing.value) return;

  const key = `${article.value.name}:${article.value.progress.currentIndex}`;
  if (!force && key === lastSpokenKey) return;

  lastSpokenKey = key;
  speakHanzi(article.value.currentHanzi);
}

/** 正确输入后的 30ms 推进：切到下一个有效汉字并朗读一次。 */
function scheduleAdvance() {
  clearAdvanceTimer();
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    pinyin.value = [];
    article.value.progress.currentIndex += 1;
    isValidPinyin.value = false;
    // 重新读取 article 会再次经过 jumpToNextValidHanzi，读到最终有效目标。
    speakCurrentHanzi();
  }, 30);
}

function onKeyPressed() {
  summary.value.onKeyPressed();
}

onActivated(() => {
  document.addEventListener("keypress", onKeyPressed);
});

onDeactivated(() => {
  document.removeEventListener("keypress", onKeyPressed);
  clearAdvanceTimer();
  stopAudio();
});

(function checkArticles() {
  const rawNames = new Set([...Object.keys(rawArticles)]);
  articles.value.forEach((v) => {
    rawNames.delete(v.type);
  });

  rawNames.forEach((v) => {
    const name = v as RawArticleName;
    const progress: Progress = {
      currentIndex: 0,
      total: rawArticles[name].length,
      correctTry: 0,
      totalTry: 0,
    };

    articles.value.push({ progress, type: name });
  });
})();

function loadArticleText(article: Article) {
  if (article.type === "CUSTOM") {
    const text = localStorage.getItem(article.name) ?? "";

    return {
      type: article.type,
      text,
      name: article.name,
      progress: article.progress,
    };
  }

  return {
    type: article.type,
    text: rawArticles[article.type] ?? "",
    name: article.type as string,
    progress: article.progress,
  };
}

function jumpToNextValidHanzi(index: number, text: string) {
  while (index < text.length && !hanziMap.h2p.has(text[index])) {
    index += 1;
  }

  return index;
}

const index = storeToRefs(store).currentArticleIndex;
const article = computed(() => {
  const articleIndex = index.value % articles.value.length;

  const info = loadArticleText(articles.value[articleIndex]);

  info.progress.currentIndex = jumpToNextValidHanzi(
    info.progress.currentIndex,
    info.text
  );

  const currentHanzi = info.text[info.progress.currentIndex] ?? "";
  const pinyin = getPinyinOf(currentHanzi);

  // 分段
  let text: [[string, number][]] = [[]];
  for (let i = 0; i < info.text.length; ++i) {
    const char = info.text[i];
    if (char === "\n") {
      text.push([]);
    } else {
      text.at(-1)?.push([char, i - info.progress.currentIndex]);
    }
  }

  return {
    type: info.type,
    text,
    currentHanzi,
    answer: [...new Set(pinyin)],
    spHints: (store.mode().py2sp.get(pinyin.at(0) ?? "") ?? "").split(""),
    progress: info.progress,
    name: info.name,
  };
});

const articleMenuItems = computed(() => {
  return articles.value
    .map((v) => {
      if (v.type === "CUSTOM") {
        return v.name;
      }
      return v.type;
    })
    .map((x) => getShortName(x))
    .concat("新建文章");
});

const isEditing = ref(false);
const editingTitle = ref("");
const editingContent = ref("");
const validInput = computed(() => {
  return editingTitle.value.length > 0 && editingContent.value.length > 0;
});

function onAriticleChange(i: number) {
  index.value = i;
  isEditing.value = i >= articles.value.length;
}

const pinyin = ref<string[]>([]);
const isValidPinyin = ref(false);

type SeqMatch = ReturnType<typeof matchSpToPinyin>;

function onSeq([lead, follow]: [string?, string?]) {
  // 正确后的 30ms 推进等待窗口：忽略期间任何输入序列（含单键），
  // 使 Keyboard 清空 keySeq，避免残留单键与下一目标/下一键错配。
  // 仅返回 true，不更新 pinyin/isValidPinyin、统计、反馈，也不重排推进定时器。
  if (advanceTimer !== null) {
    return true;
  }

  const fullInput = !!lead && !!follow;

  // 本次输入的局部判定：任一读音匹配即为最终结果。
  // 反馈/统计只依据该局部值，不使用跨调用残留的 isValidPinyin。
  let matched = false;
  let matchedRes: SeqMatch | null = null;
  let lastRes: SeqMatch | null = null;

  for (const answer of article.value.answer) {
    const res = matchSpToPinyin(
      store.mode(),
      lead as Char,
      follow as Char,
      answer
    );
    lastRes = res;
    if (res.valid && !matched) {
      matched = true;
      matchedRes = res;
    }
  }

  // 展示拼音：有匹配读音时用匹配项，否则用遍历的最终读音。
  const finalRes = matchedRes ?? lastRes;
  if (finalRes) {
    pinyin.value = [finalRes.lead, finalRes.follow].filter((v) => !!v);
  }

  if (fullInput) {
    // 完整输入：基于最终/匹配结果只更新一次 progress 与 summary（多音字不重复统计）。
    if (finalRes) {
      store.updateProgressOnValid(finalRes.lead, finalRes.follow, matched);
    }
    summary.value.onValid(matched);

    // 正确/错误反馈音：循环外只播放一次；正确音先于 30ms 推进与下一字朗读。
    if (settings.value.enableSoundFeedback) {
      playFeedback(matched ? "correct" : "incorrect");
    }
  }

  isValidPinyin.value = matched;
  return matched;
}

function scrollToFocus() {
  const cursor = document.getElementById("cursor");
  if (cursor) {
    cursor.scrollIntoView({
      inline: "nearest",
      block: "center",
      behavior: "smooth",
    });
  }
}

onActivated(() => {
  scrollToFocus();
  // 初次激活及从其他页面返回时朗读当前字。
  speakCurrentHanzi(true);
});

watchPostEffect(() => {
  scrollToFocus();

  if (isValidPinyin.value) {
    scheduleAdvance();
  }
});

watchEffect(() => {
  if (article.value.progress.currentIndex >= article.value.progress.total) {
    article.value.progress.currentIndex = 0;
  }
});

// 受控监听：文章切换 / 文章结束重置 / 新建文章后朗读新目标；
// 与推进路径共用 lastSpokenKey 去重，每个目标变化只朗读一次。
watch(
  () => `${article.value.name}:${article.value.progress.currentIndex}`,
  () => speakCurrentHanzi()
);

function getShortName(s: string, n = 10) {
  let ret = s.slice(0, n);
  if (s.length > n) {
    ret = ret.slice(0, n - 2) + "...";
  }

  return ret;
}

function saveArticle() {
  if (!validInput.value) return;
  localStorage.setItem(editingTitle.value, editingContent.value);
  isEditing.value = false;

  articles.value.push({
    type: "CUSTOM",
    name: editingTitle.value,
    progress: {
      currentIndex: 0,
      total: editingContent.value.length,
      correctTry: 0,
      totalTry: 0,
    },
  });

  editingTitle.value = "";
  editingContent.value = "";
  index.value = articles.value.length - 1;
}

function deleteArticle() {
  articles.value.splice(index.value, 1);
  onAriticleChange(index.value);
}

function shortPinyin(pinyins: string[]) {
  let ret = [];
  let count = 0;
  for (const py of pinyins) {
    if (count + py.length <= 10) {
      count += py.length;
      ret.push(py.toUpperCase());
    }
  }
  return ret.join("/");
}
</script>

<template>
  <div class="p-mode">
    <div class="display-area" :class="isEditing && 'editing'">
      <div class="p-title" :class="isEditing && 'editing'">
        <div class="pinyin">
          <Pinyin :chars="pinyin" />
        </div>

        <div class="title-info">
          <div v-if="settings.enablePinyinHint" class="answer">
            {{ shortPinyin(article.answer) }}
          </div>
          <div class="title-and-count">
            <div class="count">
              {{ article.progress.currentIndex }} 字 /
              {{ article.progress.total }} 字
            </div>
            <div class="title">
              {{ getShortName(article.name) }}
            </div>
          </div>
        </div>

        <div class="article-menu" :title="isEditing ? '' : article.name">
          <MenuList
            :items="articleMenuItems"
            :index="index"
            :on-menu-change="onAriticleChange"
          />

          <div
            v-if="article.type === 'CUSTOM'"
            class="delete-btn"
            @click="deleteArticle"
          >
            删除文章
          </div>
        </div>
      </div>
      <div v-if="!isEditing" class="text-area">
        <div class="scroll-area">
          <p v-for="(p, i) in article.text" :key="i">
            <span
              v-for="([s, t], si) in p"
              :key="si"
              class="bg-text"
              :class="t < 0 ? 'done-text' : t === 0 ? 'current-text' : ''"
              :id="t === 0 ? 'cursor' : ''"
            >
              {{ s }}
            </span>
          </p>
        </div>
      </div>
      <div v-else class="editing-text-area">
        <div class="editing-bar">
          <input
            v-model="editingTitle"
            class="editing-title"
            placeholder="键入标题"
          />
          <div
            class="save-btn"
            :class="!validInput && 'disable'"
            @click="saveArticle"
          >
            保存文章
          </div>
        </div>
        <textarea
          v-model="editingContent"
          class="editing-text"
          placeholder="键入范文……"
        />
      </div>
    </div>

    <Keyboard v-if="!isEditing" :valid-seq="onSeq" :hints="article.spHints" />

    <div v-if="!isEditing" class="summary">
      <TypeSummary
        :speed="summary.hanziPerMinutes"
        :accuracy="summary.accuracy"
        :avgpress="summary.pressPerHanzi"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../styles/color.less";
@import "../styles/var.less";

.p-mode {
  .display-area {
    padding: 0 64px 32px 32px;

    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 576px) {
      flex-direction: column;
      padding: var(--app-padding);
    }

    &.editing {
      align-items: flex-start;

      @media (max-width: 576px) {
        align-items: center;
      }
    }

    .p-title {
      margin-right: 32px;
      width: 260px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;

      @media (max-width: 576px) {
        width: 100vw;
        padding-right: calc(var(--app-padding) + 2px);
        margin-right: 0;
        box-sizing: border-box;
      }

      .pinyin {
        font-size: 12px;
      }

      .title-info {
        display: flex;
        align-items: center;
        margin-top: 8px;

        .answer {
          font-size: 20px;
          margin-right: 16px;
          font-weight: bold;

          @border: 1px solid var(--black);
          border-top: @border;
          border-bottom: @border;
        }
      }

      .title-and-count {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-weight: bold;
        font-size: 12px;

        .title {
          max-width: 160px;
          text-align: right;

          @media (max-width: 576px) {
            max-width: 100vw;
          }
        }
      }

      .article-menu {
        display: none;
        height: 110px;
      }
    }

    .p-title:hover,
    .p-title.editing {
      flex-direction: column;

      @media (max-width: 576px) {
        align-items: center;
      }

      .pinyin,
      .title-info,
      .title-and-count {
        display: none;
      }

      .article-menu {
        display: flex;
        flex-direction: column;
        position: relative;

        .menu {
          overflow: visible;
        }

        .delete-btn {
          color: @primary-color;
          opacity: 0.5;
          font-size: 14px;
          cursor: pointer;
          font-weight: bold;
          transition: all ease 0.3s;
          margin-top: 16px;
          text-align: center;
          position: absolute;
          bottom: -10px;
          padding-left: 1.4em;

          &:hover {
            opacity: 1;
          }
        }
      }
    }

    .text-area {
      position: relative;
      width: 50vw;
      max-width: calc(0.6 * var(--page-max-width));

      @media (max-width: 576px) {
        width: 100vw;
        max-width: calc(100vw - var(--app-padding) * 2);
      }

      &:before {
        content: "";
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background: linear-gradient(
          0deg,
          var(--white) 0%,
          transparent 30%,
          transparent 70%,
          var(--white) 100%
        );
        pointer-events: none;
        z-index: 999;
      }

      .scroll-area {
        overflow-y: scroll;
        height: 144px;
        position: relative;
        margin: 8px 0;

        @media (max-width: 576px) {
          height: 30vh;
        }

        .bg-text {
          opacity: 0.4;
        }

        .done-text {
          opacity: 1;
        }

        .current-text {
          text-decoration: underline;
          text-underline-offset: 2px;
          opacity: 0.8;
        }
      }
    }

    .editing-text-area {
      display: flex;
      flex-direction: column;
      margin-top: 40px;
      width: 50vw;
      max-width: calc(0.6 * var(--page-max-width));

      @media (max-width: 576px) {
        width: 100vw;
        max-width: calc(100vw - var(--app-padding) * 2);
      }

      .editing-bar {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .editing-title {
          font-family: inherit;
          font-size: 14px;
          font-weight: bold;
          border: 0;
          outline: none;
          padding: 0 8px;
          color: @primary-color;
          border-left: 5px solid @primary-color;
          flex: 1;
          background-color: transparent;
        }

        .save-btn {
          color: @primary-color;
          font-size: 14px;
          cursor: pointer;

          &.disable {
            color: var(--gray-a);
          }
        }
      }

      .editing-text {
        font-family: inherit;
        font-size: 14px;
        font-weight: bold;
        border: 0;
        outline: none;
        padding: 8px;
        height: calc(var(--page-height) - 200px);
        resize: none;
        border: 3px double var(--gray-6);
        color: var(--black);
        background-color: transparent;
        padding-left: 10px;

        @media (max-width: 576px) {
          height: calc(var(--page-height) - 300px);
        }
      }
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
}
</style>
