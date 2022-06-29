<script setup lang="ts">
import Keyboard from './components/Keyboard.vue';
</script>

<template>
  <div class="content">
    <Keyboard />
  </div>

</template>

<style lang="less">
.content {
  width: 90%;
  margin: auto;
  max-width: 900px;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
  padding: 30px;
  border-radius: 10px;
  margin-top: 50px;
}
</style>