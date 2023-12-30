<script setup lang="ts">
import { defineProps, computed, ref } from "vue";
import { useStore } from "../store";
import { storeToRefs } from "pinia";
import MenuList from "../components/MenuList.vue";
import Pinyin from "../components/Pinyin.vue";
import { shortPinyin } from "../utils/pinyin";
import { shortText } from "../utils/common";

defineProps<{
  pinyinInput: string[];
  showPinyin: boolean;
  pinyinAnswers: string[];
}>();

const CREATE_ARTICLE = "新建文章";

const store = useStore();
const isEditing = storeToRefs(store).isEditingArticle;
const settings = storeToRefs(store).settings;
const article = storeToRefs(store).currentArticle;
const articleProgress = storeToRefs(store).currentArticleProgress;
const articleMenuItems = computed(() => {
  return store.articleNames.map((v) => shortText(v)).concat([CREATE_ARTICLE]);
});
const index = ref(store.currentArticleIndex);
const isCutomArticle = computed(() => article.value.type === "CUSTOM");

function deleteArticle() {
  store.deleteArticle(store.articleNames[index.value]);
  onArticleChange(index.value);
}

function onArticleChange(i: number) {
  if (i < store.articleNames.length) {
    store.currentArticleIndex = i;
  }

  index.value = i;
  isEditing.value = i >= store.articleNames.length;
}
</script>

<template>
  <div class="p-title" :class="isEditing && 'editing'">
    <div class="pinyin" v-if="showPinyin">
      <Pinyin :chars="pinyinInput" />
    </div>

    <div class="title-info">
      <div v-if="settings.enablePinyinHint" class="answer">
        {{ shortPinyin(pinyinAnswers) }}
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
      <img src="../assets/arrow-left.svg" alt="arrow-left" class="guide-icon" />
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
</template>

<style lang="less" scoped>
@import "../styles/color.less";
@import "../styles/var.less";

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
</style>
