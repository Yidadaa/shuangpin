<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "../store";
import MenuList from "../components/MenuList.vue";

import ModeConfig from "../components/ModeConfig.vue";

const store = useStore();
const settings = storeToRefs(store).settings;

type SettingOption<T> = {
  options: Array<{
    option: T;
    name: string;
  }>;
  name: string;
};

const buildBooleanOption = (name: string): SettingOption<boolean> => ({
  options: [
    {
      option: true,
      name: "启用",
    },
    {
      option: false,
      name: "关闭",
    },
  ],
  name,
});

type SettingKeys = keyof Omit<Settings, "shuangpinMode">;

const settingOptions: {
  [_ in SettingKeys]: SettingOption<boolean | Theme>;
} = {
  enableAutoClear: buildBooleanOption("自动清空"),
  enableKeyHint: buildBooleanOption("键位提示"),
  enablePinyinHint: buildBooleanOption("拼音提示"),
  theme: {
    options: [
      { option: "auto", name: "自动" },
      { option: "light", name: "浅色" },
      { option: "dark", name: "深色" },
    ],
    name: "主题模式",
  },
};

function nextOption(name: SettingKeys) {
  const setting = settingOptions[name];
  const currentValue = settings.value[name];
  const index = setting.options.findIndex((v) => v.option === currentValue);
  const nextOption =
    setting.options[(index + 1) % setting.options.length].option;
  (settings.value[name] as boolean | Theme) = nextOption;
}

function getOptionName(name: SettingKeys) {
  const setting = settingOptions[name];
  const index = setting.options.findIndex(
    (v) => v.option === settings.value[name]
  );
  const safeIndex = Math.max(index, 0);
  return setting.options[safeIndex].name;
}

const settingItems = Object.keys(settingOptions) as Array<SettingKeys>;

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
          v-for="(settingName, i) in settingItems"
          :key="i"
          class="setting-item"
          @click="() => nextOption(settingName)"
        >
          <div class="setting-name">
            {{ settingOptions[settingName].name }}
          </div>
          <div class="setting-value">
            {{ getOptionName(settingName) }}
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

    &:hover {
      // margin-right: 0;

      .mode-actions {
        opacity: 1;
      }
    }

    .mode-actions {
      display: flex;
      align-items: center;
      cursor: default;

      opacity: 0;
      width: 120px;
      margin-right: -120px;

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
