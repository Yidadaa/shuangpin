import RandomMode from "./pages/RandomMode.vue";
import LeadMode from "./pages/LeadMode.vue";
import FollowMode from "./pages/FollowMode.vue";
import ParagraphMode from "./pages/ParagraphMode.vue";
import Settings from "./pages/Settings.vue";
import ProgressiveMode from "./pages/ProgressiveMode.vue";

import { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "渐进模式",
    component: ProgressiveMode,
  },
  {
    path: "/random-mode",
    name: "随机模式",
    component: RandomMode,
  },
  {
    path: "/lead-mode",
    name: "声母模式",
    component: LeadMode,
  },
  {
    path: "/follow-mode",
    name: "韵母模式",
    component: FollowMode,
  },
  {
    path: "/p-mode",
    name: "长句模式",
    component: ParagraphMode,
  },
  {
    path: "/settings",
    name: "设置",
    component: Settings,
  },
];
