<script setup lang="ts">
import Keyboard from './components/Keyboard.vue';
import Hanzi from './components/Hanzi.vue';
import Pinyin from './components/Pinyin.vue'
import Menu from './components/MenuList.vue'
import Bg from './components/Background.vue'
import TypeSummary from './components/TypeSummary.vue'
</script>

<template>
  <div class="content">
    <div class="main-menu">
      <Menu default-show-item />
    </div>

    <div class="input-area">
      <Pinyin />
    </div>

    <div class="hanzi-list">
      <Hanzi :hanzi-list="'随便打点字'.split('')" />
    </div>

    <Keyboard />

    <div class="summary">
      <TypeSummary :speed="65" :accuracy="Math.random()" :avgpress="Math.random() * 3" />
    </div>

    <Bg :left="{ chars: '小鹤', shuangpins: 'XNHE' }" :right="{ chars: '双拼', shuangpins: 'VLPB' }" />
  </div>
</template>

<style lang="less">
@import "./app.less";
@import "./styles/color.less";

@app-padding: 1em;

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

.input-area {
  margin-bottom: 4em;
}

.summary {
  position: absolute;
  right: @app-padding;
  bottom: @app-padding;
}

.hanzi-list {
  position: absolute;
  top: @app-padding;
  right: @app-padding;
}
</style>