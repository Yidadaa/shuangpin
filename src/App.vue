<script setup lang="ts">
import Keyboard from './components/Keyboard.vue';
import Displayer from './components/Displayer.vue';
import Pinyin from './components/Pinyin.vue'
import Menu from './components/Menu.vue'

</script>

<template>
  <div class="content">
    <Menu />
    <Pinyin />
    <Keyboard />
  </div>
</template>

<style lang="less">
@import "./app.less";

#app {
  display: flex;
  height: 100vh;
  width: 100vw;
  align-items: center;
  justify-content: center;
}

.content {
  width: 90%;
  max-width: 900px;
  box-shadow: 10px 20px 60px rgba(0, 0, 0, 0.1);
  padding: 30px;
  border-radius: 0px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>