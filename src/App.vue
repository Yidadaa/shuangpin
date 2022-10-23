<script setup lang="ts">
import Menu from "./components/MenuList.vue";
import Bg from "./components/Background.vue";
import { routes } from "./router";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "./store";
import { computed, watchPostEffect } from "vue";
import { ref, effect } from "vue";
import { getPinyinOf } from "./utils/hanzi";

const store = useStore();
const router = useRouter();
const route = useRoute();
const menuItems = routes.map((v) => v.name as string);
const menuIndex = ref(0);

effect(() => {
  const index = routes.findIndex((v) => v.path === route.path);

  if (index >= 0) {
    menuIndex.value = index;
  } else {
    router.replace(routes.at(0)?.path ?? "/");
  }
});

const spMode = computed(() => {
  const mode = store.mode();
  const name = mode.name.split("").slice(0, 2);
  const full = name.concat(["双", "拼"]).map((v) => {
    const pinyin = getPinyinOf(v).at(0) ?? "";
    const sp = mode.py2sp.get(pinyin) ?? "";
    return [v, sp];
  });

  const left = full.slice(0, 2);
  const right = full.slice(2, 4);
  const getBgItem = (item: typeof left) => ({
    chars: item.map((v) => v[0]).join(""),
    shuangpins: item
      .map((v) => v[1])
      .join("")
      .toUpperCase(),
  });

  return {
    left: getBgItem(left),
    right: getBgItem(right),
  };
});

function onMenuChange(i: number) {
  router.push(routes[i]);
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
    <div class="main-menu">
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
