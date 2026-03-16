<script setup lang="ts">
import SingleMode from '../components/SingleMode.vue';
import {allHanziList  } from '../utils/hanzi'

function nextChar() {
  if (allHanziList.length === 0) return '';
  const index = Math.floor(Math.random() * allHanziList.length);
  return allHanziList[index];
}
</script>

<template>
  <single-mode :next-char="nextChar" />
</template>
