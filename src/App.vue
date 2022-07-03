<script setup lang="ts">
import Menu from './components/MenuList.vue'
import Bg from './components/Background.vue'
import { routes } from './router'
import { useRouter } from 'vue-router'
import { useStore } from './store';
import { computed } from '@vue/reactivity';

const store = useStore()
const router = useRouter()
const menuItems = routes.map(v => v.name!) as string[]

const spMode = computed(() => {
  return store.settings.shuangpinMode.toString().split('')
})

function onMenuChange(i: number) {
  router.push(routes[i])
}

</script>

<template>
  <div class="content">
    <div class="main-menu">
      <Menu default-show-item :items="menuItems" v-on:menu-change="onMenuChange" />
    </div>

    <router-view></router-view>

    <Bg :left="{ chars: spMode.slice(0, 2).join(''), shuangpins: 'XNHE' }"
      :right="{ chars: '双拼', shuangpins: 'VLPB' }" />
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
</style>