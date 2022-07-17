<script setup lang="ts">

export type BgSideItem = {
  chars: string,
  shuangpins: string
}

export interface BgProps {
  left: BgSideItem
  right: BgSideItem
}

const props = defineProps<BgProps>()

</script>

<template>
  <div class="background">
    <div :class="name" class="bg-side" v-for="([name, item], i) in Object.entries(props)">
      <div class="chars">
        <div class="char" v-for="(char, i) in item.chars">{{ char }}</div>
      </div>
      <div class="shuangpin">
        {{ item.shuangpins }}
      </div>
    </div>
  </div>
</template>

<style lang="less">
.background {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;

  .bg-side {
    display: flex;
    flex-direction: column;
    font-weight: bold;
    line-height: 1;
    opacity: 0.05;

    .chars {
      font-size: 10em;
    }

    .shuangpin {
      padding: 0.2em 0;
      font-size: 3.5em;
      width: 3.5em;
    }
  }

  .left {
    transform: translateX(-60%);
    justify-content: flex-end;
    align-items: flex-end;

    .shuangpin {
      text-align: right;
    }
  }

  .right {
    transform: translateX(60%);
    justify-content: flex-start;
    align-items: flex-start;

    .shuangpin {
      text-align: left;
    }
  }
}
</style>