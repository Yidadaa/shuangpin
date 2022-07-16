<script setup lang="ts">
import SingleMode from '../components/SingleMode.vue';
import { hanziList } from '../utils/hanzi'

function nextChar() {
  const index = Math.floor(Math.random() * hanziList.hanzi.length)

  return '啊'
    || hanziList.hanzi[index]
}

</script>

<template>
  <single-mode :next-char="nextChar"></single-mode>
</template>

<style>
</style>