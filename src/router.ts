import RandomMode from "./pages/RandomMode.vue";
import LeadMode from "./pages/LeadMode.vue";
import FollowMode from "./pages/FollowMode.vue";
import ParagraphMode from "./pages/ParagraphMode.vue";
import Settings from "./pages/Settings.vue";

import { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "随机模式",
    component: RandomMode,
  },
  {
    path: "/p-mode",
    name: "长句模式",
    component: ParagraphMode,
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
    path: "/settings",
    name: "设置",
    component: Settings,
  },
];
