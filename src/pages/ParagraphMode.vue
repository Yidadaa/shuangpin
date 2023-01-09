<script setup lang="ts">
import {
  ref,
  computed,
  watchPostEffect,
  onActivated,
  onDeactivated,
} from "vue";
import { useStore } from "../store";
import { storeToRefs } from "pinia";

import { getPinyinOf } from "../utils/hanzi";
import { matchSpToPinyin } from "../utils/keyboard";

import { shortText } from "../utils/common";

import MenuList from "../components/MenuList.vue";
import Pinyin from "../components/Pinyin.vue";
import Keyboard from "../components/Keyboard.vue";
import TypeSummary from "../components/TypeSummary.vue";
import EditArticlePage from "./EditArticlePage.vue";
import ParagraphTextInput from "../components/ParagraphTextInput.vue";

// TODO: 将这个页面拆分成以下模块：
// 1. 文章进度和文章选择
// 2. 自由输入模块
// 3. 固定输入模块

const CREATE_ARTICLE = "新建文章";
const store = useStore();
const settings = storeToRefs(store).settings;

const summary = storeToRefs(store).summary;
const isFreeMode = storeToRefs(store).isFreeMode;

const index = ref(store.currentArticleIndex);
const articleProgress = storeToRefs(store).currentArticleProgress;
const article = storeToRefs(store).currentArticle;
const isEditing = storeToRefs(store).isEditingArticle;
const isCutomArticle = computed(() => article.value.type === "CUSTOM");

const currentInput = computed(() => {
  const info = article.value;
  const currentHanzi = info.text[articleProgress.value.currentIndex] ?? "";
  const pinyin = getPinyinOf(currentHanzi);

  return {
    answer: [...new Set(pinyin)],
    spHints: (store.mode().py2sp.get(pinyin.at(0) ?? "") ?? "").split(""),
  };
});

const articleMenuItems = computed(() => {
  return store.articleNames.map((v) => shortText(v)).concat([CREATE_ARTICLE]);
});

function onArticleChange(i: number) {
  if (i < store.articleNames.length) {
    store.currentArticleIndex = i;
  }

  index.value = i;
  isEditing.value = i >= store.articleNames.length;
}

function onArticleSave(newIndex: number) {
  index.value = newIndex;
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

function deleteArticle() {
  store.deleteArticle(store.articleNames[index.value]);
  onArticleChange(index.value);
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

const displayAreaClass = computed(() => {
  let retClasses = [];

  if (isEditing.value) {
    retClasses.push("editing");
  }

  if (isFreeMode.value) {
    retClasses.push("free-mode");
  }

  return retClasses.join(" ");
});
</script>

<template>
  <div class="p-mode">
    <div class="display-area" :class="displayAreaClass">
      <div class="p-title" :class="isEditing && 'editing'">
        <div class="pinyin" v-if="!isFreeMode">
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

        <div class="hover-guide">
          <img
            src="../assets/arrow-left.svg"
            alt="arrow-left"
            class="guide-icon"
          />
          <span class="guide-text">更换文章</span>
        </div>

        <div class="article-menu">
          <MenuList
            :items="articleMenuItems"
            :index="index"
            :on-menu-change="onArticleChange"
          />

          <div
            v-if="isCutomArticle && !isEditing"
            class="delete-btn"
            @click="deleteArticle"
          >
            删除文章
          </div>
        </div>
      </div>
      <ParagraphTextInput v-if="!isEditing" />

      <EditArticlePage v-if="isEditing" :on-save="onArticleSave" />
    </div>

    <Keyboard
      v-if="!isEditing && !isFreeMode"
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
      display: flex;
      flex-direction: column;
      align-items: flex-end;

      margin-right: 32px;
      width: 260px;

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

      .hover-guide {
        display: flex;
        align-items: center;

        margin-top: 10px;
        opacity: 0.5;

        .guide-icon {
          height: 14px;
          width: 14px;
          margin-bottom: -2px;
          margin-right: 2px;
        }

        .guide-text {
          font-size: 12px;
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
      .title-and-count,
      .hover-guide {
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
