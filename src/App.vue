<script setup lang="ts">
import Menu from './components/MenuList.vue'
import Bg from './components/Background.vue'
import { routes } from './router'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from './store';
import { computed } from '@vue/reactivity';
import { ref, effect, onMounted, onUnmounted } from 'vue';
import { getPinyinOf } from './utils/hanzi';

const store = useStore()
const router = useRouter()
const route = useRoute()
const menuItems = routes.map(v => v.name!) as string[]
const menuIndex = ref(0)

function arrawChangeMenu(e: KeyboardEvent) {
  if (e.key === 'ArrowUp') {
    menuIndex.value = Math.max(0, menuIndex.value - 1)
  } else if (e.key === 'ArrowDown') {
    menuIndex.value = Math.max(0, menuIndex.value + 1)
  }
}

onMounted(() => {
  document.addEventListener('keydown', arrawChangeMenu)
})

onUnmounted(() => {
  document.removeEventListener('keydown', arrawChangeMenu)
})

effect(() => {
  const index = routes.findIndex(v => v.path === route.path)

  if (index >= 0) {
    menuIndex.value = index
  } else {
    router.replace(routes.at(0)?.path ?? '/')
  }
})

const spMode = computed(() => {
  const mode = store.mode
  const name = store.settings.shuangpinMode.toString().split('').slice(0, 2)
  const full = name.concat(['双', '拼']).map(v => {
    const pinyin = getPinyinOf(v) ?? ''
    const sp = mode.py2sp.get(pinyin) ?? ''
    return [v, sp]
  })

  const left = full.slice(0, 2)
  const right = full.slice(2, 4)
  const getBgItem = (item: typeof left) => ({
    chars: item.map(v => v[0]).join(''),
    shuangpins: item.map(v => v[1]).join('').toUpperCase()
  })

  return {
    left: getBgItem(left),
    right: getBgItem(right)
  }
})

function onMenuChange(i: number) {
  router.push(routes[i])
}

</script>

<template>
  <div class="content">
    <div class="main-menu">
      <Menu default-show-item :index="menuIndex" :items="menuItems" v-on:menu-change="onMenuChange" />
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
  width: 90%;
  max-width: 900px;
  min-height: 30em;
  box-shadow: 10px 20px 60px rgba(0, 0, 0, 0.1);
  padding: 30px;
  border-radius: 0px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: center;
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
  background-color: rgba(0, 0, 0, 0.02);
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.03);
}

@media (prefers-color-scheme: dark) {
  .content {
    color: #aaa;
    border-color: #444;
  }

  *::-webkit-scrollbar-track {
    background-color: rgba(255, 255, 255, 0.02);
  }

  *::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.03);
  }
}
</style>