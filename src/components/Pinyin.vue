<script lang="ts" setup>
import { ref } from 'vue'

const pinyin = ref({
  lead: "p",
  follow: "ing"
})
</script>

<template>
  <div class="pinyin-input">
    <div class="lead cursor">{{ pinyin.lead.toUpperCase() }}</div>
    <div class="follow cursor blink-cursor">{{ pinyin.follow.toUpperCase() }}</div>
  </div>
</template>

<style lang="less">
.pinyin-input {
  display: flex;
  font-weight: bold;
  font-size: 72px;

  .lead,
  .follow {
    position: relative;
  }

  .cursor::after {
    position: absolute;
    bottom: 0px;
    left: 0px;
    content: "";
    width: 100%;
    height: 5px;
    background-color: black;
  }

  .blink-cursor::after {
    animation: alternate infinite .6s blink;
  }

  .lead {
    margin-right: 5px;
  }
}

@keyframes blink {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>