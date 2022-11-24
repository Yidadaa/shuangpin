<script setup lang="ts">
import Pinyin from "../components/Pinyin.vue";
import Keyboard from "../components/Keyboard.vue";
import TypeSummary from "../components/TypeSummary.vue";

import { ref, watchPostEffect, onActivated, onDeactivated } from "vue";
import { useStore } from "../store";
import { storeToRefs } from "pinia";

import { computed } from "vue";
import { getPinyinOf } from "../utils/hanzi";
import { matchSpToPinyin } from "../utils/keyboard";
import { TypingSummary } from "../utils/summary";
import MenuList from "../components/MenuList.vue";
import { shortText } from "../utils/common";

const store = useStore();
const settings = storeToRefs(store).settings;

const summary = ref(new TypingSummary());

const isFreeInput = ref(false);
const inputText = ref("");

function onKeyPressed() {
  summary.value.onKeyPressed();
}

onActivated(() => {
  document.addEventListener("keypress", onKeyPressed);
});

onDeactivated(() => {
  document.removeEventListener("keypress", onKeyPressed);
});

const index = storeToRefs(store).currentArticleIndex;
const articleProgress = storeToRefs(store).currentArticleProgress;
const article = storeToRefs(store).currentArticle;

const currentInput = computed(() => {
  const info = article.value;
  const currentHanzi = info.text[articleProgress.value.currentIndex] ?? "";
  const pinyin = getPinyinOf(currentHanzi);

  return {
    answer: [...new Set(pinyin)],
    spHints: (store.mode().py2sp.get(pinyin.at(0) ?? "") ?? "").split(""),
  };
});

// 分段
const paragraphs = computed(() => {
  let paragraphs: [[string, number][]] = [[]];
  for (let i = 0; i < article.value.text.length; ++i) {
    const char = article.value.text[i];
    if (char === "\n") {
      paragraphs.push([]);
    } else {
      paragraphs.at(-1)?.push([char, i - articleProgress.value!.currentIndex]);
    }
  }

  return paragraphs;
});

const articleMenuItems = computed(() => {
  return store.articleNames.concat("新建文章");
});

const isEditing = ref(false);
const editingTitle = ref("");
const editingContent = ref("");
const validInput = computed(() => {
  return editingTitle.value.length > 0 && editingContent.value.length > 0;
});

function onAriticleChange(i: number) {
  index.value = i;
  isEditing.value = i >= store.articleNames.length;
}

const pinyin = ref<string[]>([]);
const isValidPinyin = ref(false);

function onSeq([lead, follow]: [string?, string?]) {
  for (const answer of currentInput.value.answer) {
    const res = matchSpToPinyin(
      store.mode(),
      lead as Char,
      follow as Char,
      answer
    );
    pinyin.value = [res.lead, res.follow].filter((v) => !!v);

    if (!!lead && !!follow) {
      store.updateProgressOnValid(res.lead, res.follow, res.valid);
    }

    isValidPinyin.value ||= res.valid;

    if (isValidPinyin.value) break;
  }

  const fullInput = !!lead && !!follow;
  if (fullInput) {
    summary.value.onValid(isValidPinyin.value);
  }

  return isValidPinyin.value;
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

onActivated(() => scrollToFocus());

watchPostEffect(() => {
  scrollToFocus();

  if (isValidPinyin.value) {
    setTimeout(() => {
      pinyin.value = [];
      store.updateArticleProgress();
      isValidPinyin.value = false;
    }, 30);
  }
});

function saveArticle() {
  if (!validInput.value) return;
  isEditing.value = false;

  store.saveArticle({
    name: editingTitle.value,
    text: editingContent.value,
    type: "CUSTOM",
  });

  editingTitle.value = "";
  editingContent.value = "";
  index.value = store.articleNames.length - 1;
}

function deleteArticle() {
  store.deleteArticle(store.articleNames[index.value]);
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
            {{ shortPinyin(currentInput.answer) }}
          </div>
          <div class="title-and-count">
            <div class="count">
              {{ articleProgress!.currentIndex }} 字 /
              {{ articleProgress!.total }} 字
            </div>
            <div class="title">
              {{ shortText(article.name) }}
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
      <div class="text-area" v-if="isFreeInput && !isEditing">
        <div class="scroll-area">
          <span
            v-for="(s, i) in article.text"
            :key="i"
            :class="
              i < inputText.length
                ? inputText[i] === s
                  ? 'done-text'
                  : 'error-text'
                : 'bg-text'
            "
            :id="i === inputText.length ? 'cursor' : ''"
          >
            <br v-if="s === '\n'" />
            <span v-else>{{ s }}</span>
          </span>
          <textarea role="textbox" class="scroll-input" v-model="inputText" />
        </div>
      </div>

      <div v-if="!isEditing && !isFreeInput" class="text-area">
        <div class="scroll-area">
          <p v-for="(p, i) in paragraphs" :key="i">
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
      <div v-if="isEditing" class="editing-text-area">
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

    <Keyboard
      v-if="!isEditing"
      :valid-seq="onSeq"
      :hints="currentInput.spHints"
    />

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

        .error-text {
          background-color: @primary-color;
        }

        .current-text {
          text-decoration: underline;
          text-underline-offset: 2px;
          opacity: 0.8;
        }

        p {
          margin: 0;
        }

        .scroll-input {
          width: 100%;
          height: 100%;
          padding: 0;
          margin: 0;
          background: transparent;
          position: absolute;
          top: 0;
          left: 0;
          font-size: 16px;
          border: 0;
          line-height: 1.5;
          opacity: 0.1;
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
