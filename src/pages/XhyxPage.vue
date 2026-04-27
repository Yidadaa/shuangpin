<script setup lang="ts">
import { computed, ref } from "vue";
import MenuList from "../components/MenuList.vue";
import SingleMode from "../components/SingleMode.vue";
import { hanziList } from "../utils/hanzi";

const menuItems = ["音形练习", "查字笔画"];
const menuIndex = ref(0);

function onMenuChange(i: number) {
  menuIndex.value = i;
}

function nextChar() {
  const index = Math.floor(Math.random() * hanziList.hanzi.length);
  return hanziList.hanzi[index];
}

const currentTitle = computed(() => menuItems[menuIndex.value] ?? menuItems[0]);
</script>

<template>
  <div class="xhyx-page page">
    <div class="xhyx-menu">
      <MenuList
        default-show-item
        :index="menuIndex"
        :items="menuItems"
        :on-menu-change="onMenuChange"
      />
    </div>

    <div v-if="menuIndex === 0" class="practice-panel">
      <div class="panel-note">小鹤音形四码练习，前两码固定按小鹤双拼。</div>
      <SingleMode :next-char="nextChar" scheme="xhyx" />
    </div>

    <div v-else class="placeholder-panel">
      <div class="placeholder-kicker">即将加入</div>
      <div class="placeholder-title">{{ currentTitle }}</div>
      <p class="placeholder-copy">
        这里预留给查字、笔画和其他音形辅助功能，后续可以独立扩展。
      </p>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../styles/color.less";
@import "../styles/var.less";

.xhyx-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 88px 0 0;
  box-sizing: border-box;

  @media (max-width: 576px) {
    padding-top: 108px;
  }
}

.xhyx-menu {
  position: absolute;
  top: 18px;
  left: 0;
  color: @primary-color;

  :deep(.selected-item) {
    background-color: @primary-color;
    color: white;
  }

  @media (max-width: 576px) {
    top: 64px;
    left: 0;
  }
}

.practice-panel,
.placeholder-panel {
  width: 100%;
  height: calc(100% - 88px);
}

.panel-note {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: bold;
  opacity: 0.55;
  text-align: center;
  white-space: nowrap;

  @media (max-width: 576px) {
    bottom: 88px;
    left: var(--app-padding);
    right: var(--app-padding);
    transform: none;
    white-space: normal;
  }
}

.placeholder-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 72px 0 160px;
  box-sizing: border-box;

  @media (max-width: 576px) {
    padding: 32px var(--app-padding) 0;
  }
}

.placeholder-kicker {
  color: @primary-color;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.2em;
  margin-bottom: 14px;
}

.placeholder-title {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 12px;
}

.placeholder-copy {
  margin: 0;
  max-width: 360px;
  line-height: 1.8;
  font-weight: bold;
  opacity: 0.7;
}
</style>
