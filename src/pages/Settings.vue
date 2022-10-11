<script setup lang="ts">
import { computed, ref, ssrContextKey } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "../store";
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

const CREATE_NAME = "新建双拼";
const shuangpins = computed(() => store.modes.concat(CREATE_NAME));
const spName = ref(settings.value.shuangpinMode as string);
const editName = computed(() => store.modes[store.modes.indexOf(spName.value)]);
const isEditing = ref(false);
const isCutom = computed(() => store.mode().custom);
const shouldShowEdit = computed(() => spName.value !== CREATE_NAME);

const currentIndex = computed(() => {
  return shuangpins.value.indexOf(spName.value);
});

function onModeChange(i: number) {
  spName.value = shuangpins.value[i];

  if (i < shuangpins.value.length - 1) {
    settings.value.shuangpinMode = shuangpins.value[
      i
    ] as unknown as ShuangpinType;
    isEditing.value = false;
  } else {
    isEditing.value = true;
  }
}

function deleteMode() {
  if (confirm("确认删除？")) {
    store.deleteConfig(spName.value);
    settings.value.shuangpinMode = store.modes.at(
      Math.max(currentIndex.value, -1)
    ) as ShuangpinType;
    spName.value = settings.value.shuangpinMode;
  }
}

function downloadConfig(name: string) {
  store.loadConfig(name).download();
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
      <div class="mode-actions">
        <div
          class="mode-edit mode-action"
          :class="shouldShowEdit && 'show'"
          @click="isEditing = true"
        >
          编辑
        </div>
        <div
          class="mode-download mode-action"
          @click="deleteMode"
          :class="shouldShowEdit && isCutom && 'show'"
        >
          删除
        </div>
        <div
          class="mode-delete mode-action"
          :class="shouldShowEdit && 'show'"
          @click="downloadConfig(spName)"
        >
          下载
        </div>
      </div>
    </div>

    <div class="mode-config">
      <ModeConfig
        :is-editing="isEditing"
        :editing-name="editName"
        :key="spName"
      />
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

    .mode-actions {
      display: flex;
      align-items: center;
      cursor: default;

      .mode-action {
        margin-right: 5px;
        cursor: pointer;
        color: var(--black);

        width: 0;
        overflow: hidden;
        white-space: nowrap;
        opacity: 0;

        &.show {
          width: 35px;
          opacity: 0.5;
        }

        &:hover {
          opacity: 1;
        }

        &:last-child {
          margin-right: 0;
        }
      }

      &.hide {
        width: 0;
      }
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
