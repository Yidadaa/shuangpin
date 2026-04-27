<script setup lang="ts">
import Menu from "./components/MenuList.vue";
import Bg from "./components/Background.vue";
import { shuangpinRoutes, xhyxRoutes } from "./router";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "./store";
import { computed, watch, watchPostEffect } from "vue";
import { ref, effect } from "vue";
import { getPinyinOf } from "./utils/hanzi";

const store = useStore();
const router = useRouter();
const route = useRoute();
const menuIndex = ref(0);
const lastShuangpinPath = ref((shuangpinRoutes.at(0)?.path as string) ?? "/");

const isXhyxMode = computed(() =>
  xhyxRoutes.some((item) => item.path === route.path)
);
const currentRoutes = computed(() =>
  isXhyxMode.value ? xhyxRoutes : shuangpinRoutes
);
const menuItems = computed(() =>
  currentRoutes.value.map((v) => v.name as string)
);

effect(() => {
  const index = currentRoutes.value.findIndex((v) => v.path === route.path);

  if (index >= 0) {
    menuIndex.value = index;
  } else {
    router.replace(shuangpinRoutes.at(0)?.path ?? "/");
  }
});

watch(
  () => route.path,
  (path) => {
    if (shuangpinRoutes.some((item) => item.path === path)) {
      lastShuangpinPath.value = path;
    }
  },
  { immediate: true }
);

function buildBgItem(chars: string, mode: ShuangpinMode) {
  return {
    chars,
    shuangpins: chars
      .split("")
      .map((char) => {
        const pinyin = getPinyinOf(char).at(0) ?? "";
        return mode.py2sp.get(pinyin) ?? "";
      })
      .join("")
      .toUpperCase(),
  };
}

const spMode = computed(() => {
  if (isXhyxMode.value) {
    const mode = store.practiceMode("xhyx");
    return {
      left: buildBgItem("小鹤", mode),
      right: buildBgItem("音形", mode),
    };
  }

  const mode = store.mode();
  const name = mode.name.slice(0, 2);
  return {
    left: buildBgItem(name, mode),
    right: buildBgItem("双拼", mode),
  };
});

function onMenuChange(i: number) {
  router.push(currentRoutes.value[i]);
}

function switchMode(mode: "shuangpin" | "xhyx") {
  if (mode === "xhyx") {
    router.push(xhyxRoutes.at(0)?.path ?? "/xhyx");
    return;
  }

  router.push(lastShuangpinPath.value);
}

watchPostEffect(() => {
  const theme = store.settings.theme;

  document.body.classList.remove("light");
  document.body.classList.remove("dark");

  if (theme === "dark") {
    document.body.classList.add("dark");
  } else if (theme === "light") {
    document.body.classList.add("light");
  }
});
</script>

<template>
  <div class="content">
    <div class="mode-switch">
      <button
        class="mode-switch-btn"
        :class="!isXhyxMode && 'active'"
        @click="switchMode('shuangpin')"
      >
        双拼
      </button>
      <button
        class="mode-switch-btn"
        :class="isXhyxMode && 'active'"
        @click="switchMode('xhyx')"
      >
        音形
      </button>
    </div>

    <div v-if="!isXhyxMode" class="main-menu">
      <Menu
        default-show-item
        enable-arrow
        :index="menuIndex"
        :items="menuItems"
        @menu-change="onMenuChange"
      />
    </div>

    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>

    <Bg :left="spMode.left" :right="spMode.right" />
  </div>
</template>

<style lang="less">
@import "./app.less";
@import "./styles/color.less";
@import "./styles/var.less";

#app {
  display: flex;
  height: 100vh;
  width: 100vw;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.content {
  box-sizing: border-box;
  width: var(--page-width);
  max-width: var(--page-max-width);
  height: var(--page-height);
  box-shadow: 10px 20px 60px rgba(0, 0, 0, 0.1);
  border-radius: 0px;
  padding: var(--app-padding);
  border: 1px solid var(--gray-010);
  position: relative;
  color: var(--black);

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.mode-switch {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: inline-flex;
  border: 1px solid var(--gray-010);
  background-color: var(--white);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);

  @media (max-width: 576px) {
    top: 12px;
  }
}

.mode-switch-btn {
  border: 0;
  background: transparent;
  color: var(--black);
  padding: 8px 14px;
  font-family: inherit;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all ease 0.2s;

  &:hover {
    background-color: var(--gray-002);
  }

  &.active {
    background-color: @primary-color;
    color: white;
  }
}

.main-menu {
  color: @primary-color;
  position: absolute;
  top: 0;
  left: 0;

  .selected-item {
    background-color: @primary-color;
    color: white;
  }
}

.page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

*::-webkit-scrollbar {
  width: 5px;
}

*::-webkit-scrollbar-track {
  background-color: var(--gray-002);
}

*::-webkit-scrollbar-thumb {
  background-color: var(--gray-003);
}
</style>
