<script lang="ts" setup>

const props = defineProps<{
  chars: string[];
}>();
</script>

<template>
  <div class="pinyin-input">
    <div v-for="(char, ci) in chars" :key="ci" class="cursor">
      {{ char.toUpperCase() }}
    </div>
    <div v-if="chars.length === 0" class="cursor" />
  </div>
</template>

<style lang="less">
.pinyin-input {
  display: flex;
  font-weight: bold;
  font-size: 60px;
  line-height: 1.2;

  .cursor {
    position: relative;
    text-align: center;
    min-height: 1.2em;
    min-width: 0.5em;

    &:first-child {
      margin-right: 5px;
    }

    &::after {
      position: absolute;
      bottom: 0px;
      left: 0px;
      content: "";
      width: 100%;
      height: 5px;
      background-color: var(--black);
      margin-top: 5px;
    }

    &:last-child::after {
      animation: alternate infinite 0.6s blink;
    }
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
