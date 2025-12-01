<script setup lang="ts">
import { computed, ref } from "vue";
import { useStore } from "../store";

const props = defineProps<{
  onSave: (index: number) => void;
}>();

const store = useStore();

const editingTitle = ref("");
const editingContent = ref("");
const validInput = computed(() => {
  return editingTitle.value.length > 0 && editingContent.value.length > 0;
});

function saveArticle() {
  if (!validInput.value) return;
  store.isEditingArticle = false;

  store.saveArticle({
    name: editingTitle.value,
    text: editingContent.value,
    type: "CUSTOM",
  });

  editingTitle.value = "";
  editingContent.value = "";
  store.currentArticleIndex = store.articleNames.length - 1;
  props.onSave(store.currentArticleIndex);
}
</script>

<template>
  <div class="editing-text-area">
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
</template>

<style lang="less" scoped>
@import "../styles/color.less";
@import "../styles/var.less";

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
</style>
