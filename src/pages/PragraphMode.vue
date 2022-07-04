<script setup lang="ts">
import Pinyin from '../components/Pinyin.vue';
import Keyboard from '../components/Keyboard.vue';
import { onMounted, ref } from 'vue';

const text = `燕子去了，有再来的时候；杨柳枯了，有再青的时候；桃花谢了，有再开的时候。但是，聪明的，你告诉我，我们的日子为什么一去不复返呢？——是有人偷了他们罢：那是谁？又藏在何处呢？是他们自己逃走了罢：现在又到了哪里呢？
我不知道他们给了我多少日子；但我的手确乎是渐渐空虚了。在默默里算着，八千多日子已经从我手中溜去；像针尖上一滴水滴在大海里，我的日子滴在时间的流里，没有声音，也没有影子。我不禁头涔涔而泪潸潸了。
去的尽管去了，来的尽管来着；去来的中间，又怎样地匆匆呢？早上我起来的时候，小屋里射进两三方斜斜的太阳。太阳他有脚啊，轻轻悄悄地挪移了；我也茫茫然跟着旋转。于是——洗手的时候，日子从水盆里过去；吃饭的时候，日子从饭碗里过去；默默时，便从凝然的双眼前过去。我觉察他去的匆匆了，伸出手遮挽时，他又从遮挽着的手边过去，天黑时，我躺在床上，他便伶伶俐俐地从我身上跨过，从我脚边飞去了。等我睁开眼和太阳再见，这算又溜走了一日。我掩着面叹息。但是新来的日子的影儿又开始在叹息里闪过了。
在逃去如飞的日子里，在千门万户的世界里的我能做些什么呢？只有徘徊罢了，只有匆匆罢了；在八千多日的匆匆里，除徘徊外，又剩些什么呢？过去的日子如轻烟，被微风吹散了，如薄雾，被初阳蒸融了；我留着些什么痕迹呢？我何曾留着像游丝样的痕迹呢？我赤裸裸来到这世界，转眼间也将赤裸裸的回去罢？但不能平的，为什么偏要白白走这一遭啊？
你聪明的，告诉我，我们的日子为什么一去不复返呢？`

const cursor = ref<HTMLDivElement>()

onMounted(() => {
  console.log(cursor)
  if (cursor.value) {
    const scrollEl = cursor.value.parentElement;
    scrollEl?.scrollTo(0, 100)
  }
})
</script>

<template>
  <div class="p-mode">
    <div class="display-area">
      <div class="p-title">
        <Pinyin :chars="[]" />

        <div class="title-and-count">
          <div class="count">401 字 / 1351 字</div>
          <div class="title">论快乐</div>
        </div>
      </div>
      <div class="text-area">
        <div class="scroll-area">
          <div class="bg-text">
            <p v-for="(p, i) in text.split('\n')">{{ p }}</p>
          </div>
          <div class="done-text" ref="cursor">
            <p v-for="(p, i) in text.slice(0, 100).split('\n')">{{ p }}</p>
          </div>
        </div>
      </div>
    </div>

    <Keyboard />
  </div>
</template>

<style lang="less" scoped>
@import '../styles/color.less';

.p-mode {
  .display-area {
    margin-bottom: 2em;

    display: flex;
    align-items: center;
    justify-content: center;

    .p-title {
      margin-right: 2em;

      .title-and-count {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-weight: bold;

        .count {
          margin-top: 0.5em;
        }
      }
    }

    .text-area {
      max-width: 50%;
      position: relative;

      &:before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background: rgb(0, 0, 0);
        background: linear-gradient(0deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0) 80%, rgba(255, 255, 255, 1) 100%);
        pointer-events: none;
        z-index: 999;
      }

      .scroll-area {
        overflow-y: scroll;
        height: 10em;
        position: relative;

        .done-text {
          position: absolute;
          top: 0;

          p:last-child:after {
            content: '哪';
            text-decoration: underline;
            text-underline-offset: 2px;
          }
        }

        .bg-text {
          opacity: 0.5;
        }
      }
    }
  }
}
</style>