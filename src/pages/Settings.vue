<script setup lang="ts">
import { computed, ref, ssrContextKey } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "../store";
import { shuangpins as sps } from "../utils/keyboard";
import MenuList from "../components/MenuList.vue";
import { watchPostEffect } from "vue";

import ModeConfig from "../components/ModeConfig.vue";

const store = useStore();
const settings = storeToRefs(store).settings;

const buildSettingItem = (name: keyof Omit<Settings, "shuangpinMode">) => {
  return [
    settings.value[name] ? "启用" : "关闭",
    () => (settings.value[name] = !settings.value[name]),
  ];
};

watchPostEffect(() => {
  if (settings.value.enableForceDark) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
});

const settingItems = computed(
  () =>
    [
      ["强制深色", ...buildSettingItem("enableForceDark")],
      ["键位提示", ...buildSettingItem("enableKeyHint")],
      ["拼音提示", ...buildSettingItem("enablePinyinHint")],
      ["自动清空", ...buildSettingItem("enableAutoClear")],
    ] as [string, string, () => void][]
);

const shuangpins = computed(() => (sps as string[]).concat("新建双拼"));
const spName = ref(settings.value.shuangpinMode as string);
const isEditing = computed(() => !(sps as string[]).includes(spName.value));

const currentIndex = computed(() => {
  return shuangpins.value.indexOf(spName.value);
});

function onModeChange(i: number) {
  spName.value = shuangpins.value[i];

  if (i < shuangpins.value.length - 1) {
    settings.value.shuangpinMode = shuangpins.value[
      i
    ] as unknown as ShuangpinType;
  }
}
</script>

<template>
  <div class="settings-page">
    <Transition name="slide-from-bottom">
      <div class="settings" v-if="!isEditing">
        <div
          v-for="([name, value, toggleValue], i) in settingItems"
          :key="i"
          class="setting-item"
          @click="toggleValue"
        >
          <div class="setting-name">
            {{ name }}
          </div>
          <div class="setting-value">
            {{ value }}
          </div>
        </div>
      </div>
    </Transition>

    <div class="mode-setting setting-item">
      <div class="setting-name">当前模式</div>
      <div class="setting-value">
        <MenuList
          :items="shuangpins"
          :on-menu-change="onModeChange"
          :index="currentIndex"
        />
      </div>
    </div>

    <div class="mode-config">
      <ModeConfig :is-editing="isEditing" />
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../styles/color.less";
@import "../styles/animation.less";

.settings-page {
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 576px) {
    height: 100vh;
    padding-top: 20vh;
  }

  .settings {
    padding-top: 32px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px 32px;
  }

  .setting-item {
    display: flex;
    font-weight: bold;
    cursor: pointer;

    .setting-name {
      color: @primary-color;
      margin-right: 16px;
    }
  }

  .mode-setting {
    align-items: baseline;
    max-height: 6em;
    margin-bottom: 2px;

    .setting-name {
      height: 2em;
    }
  }

  .mode-config {
    @media (max-width: 576px) {
      position: absolute;
      bottom: var(--app-padding);
    }
  }
}
</style>
