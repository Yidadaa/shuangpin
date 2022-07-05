<script setup lang="ts">
import { computed, ComputedRef } from '@vue/reactivity';
import { storeToRefs } from 'pinia';
import Keyboard from '../components/Keyboard.vue';
import { useStore } from '../store'
import { shuangpins } from '../utils/keyboard'
import MenuList from '../components/MenuList.vue';

const store = useStore()
const settings = storeToRefs(store).settings

const buildSettingItem = (name: keyof Omit<Settings, 'shuangpinMode'>) => {
  return [settings.value[name] ? '启用' : '关闭', () => settings.value[name] = !settings.value[name]]
}

const settingItems = computed(() => [
  ['分词按键', ...buildSettingItem('enableSeg')],
  ['键位提示', ...buildSettingItem('enableKeyHint')],
  ['拼音提示', ...buildSettingItem('enablePinyinHint')],
  ['自动清空', ...buildSettingItem('enableAutoClear')]
] as [string, string, () => void][])

const currentIndex = computed(() => {
  return shuangpins.indexOf(settings.value.shuangpinMode)
})

function onModeChange(i: number) {
  settings.value.shuangpinMode = shuangpins[i]
}

</script>

<template>
  <div class="settings-page">
    <div class="settings">
      <div class="setting-item" v-for="([name, value, toggleValue], i) in settingItems" @click="toggleValue">
        <div class="setting-name">{{ name }}</div>
        <div class="setting-value">{{ value }}</div>
      </div>
    </div>

    <div class="mode-setting setting-item">
      <div class="setting-name">当前模式</div>
      <div class="setting-value">
        <MenuList :items="shuangpins" :on-menu-change="onModeChange" :index="currentIndex" />
      </div>
    </div>

    <Keyboard />
  </div>
</template>

<style lang="less" scoped>
@import '../styles/color.less';

.settings-page {
  display: flex;
  flex-direction: column;
  align-items: center;

  .settings {
    padding-top: 2em;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1em 2em;
  }

  .setting-item {
    display: flex;
    font-weight: bold;
    cursor: pointer;

    .setting-name {
      color: @primary-color;
      margin-right: 1em;
    }
  }

  .mode-setting {
    align-items: baseline;
  }
}
</style>