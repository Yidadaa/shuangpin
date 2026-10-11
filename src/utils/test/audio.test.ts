import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import type { FeedbackType } from "../audio";

/**
 * CP-03：汉字朗读行为 + CP-05：正/误反馈音单元测试。
 *
 * 针对 src/utils/audio.ts 的固定公开 API（unlockAudio / speakHanzi /
 * stopAudio / playFeedback）验证外部可观察行为。生产代码已完整实现朗读
 * 与反馈音（原 RED 用例已随实现转 GREEN）；本文件不实现任何生产逻辑。
 *
 * jsdom 不提供 speechSynthesis / SpeechSynthesisUtterance / Web Audio
 * （AudioContext 等），这里在 beforeEach 注入可恢复的 mock（朗读与反馈
 * 音分开注入），afterEach 恢复全部全局状态；每个用例通过
 * vi.resetModules() 重新导入被测模块以隔离模块级状态，不依赖执行顺序。
 * 反馈音测试不依赖真实计时器或音频设备，全部通过 oscillator/gain spy 验证；
 * Chromium cancel 竞态用例使用 fake timers 控制“下一宏任务”。
 */

/** 测试用 SpeechSynthesisUtterance 替身（记录 text / lang 等属性）。 */
class MockSpeechSynthesisUtterance {
  text: string;
  lang = "";
  voice: unknown = null;
  volume = 1;
  rate = 1;
  pitch = 1;
  onstart: unknown = null;
  onend: unknown = null;
  onerror: unknown = null;

  constructor(text = "") {
    this.text = text;
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return false;
  }
}

interface MockSpeechSynthesis {
  speaking: boolean;
  paused: boolean;
  pending: boolean;
  onvoiceschanged: null | (() => void);
  speak: Mock<[MockSpeechSynthesisUtterance], void>;
  cancel: Mock<[], void>;
  pause: Mock<[], void>;
  resume: Mock<[], void>;
  getVoices: Mock<[], SpeechSynthesisVoice[]>;
}

function createSpeechSynthesisMock(): MockSpeechSynthesis {
  const synth: MockSpeechSynthesis = {
    speaking: false,
    paused: false,
    pending: false,
    onvoiceschanged: null,
    speak: vi.fn((_utterance: MockSpeechSynthesisUtterance) => {
      synth.speaking = true;
      synth.pending = false;
    }),
    cancel: vi.fn(() => {
      // Chromium 的 cancel() 异步生效：speaking/pending 不会在调用后立即
      // 复位，紧随其后的同步 speak 会被静默丢弃。mock 保持 speaking/pending
      // 不变以模拟该竞态（由被测模块用“下一宏任务”延迟朗读来规避）。
    }),
    pause: vi.fn(() => {
      synth.paused = true;
    }),
    resume: vi.fn(() => {
      synth.paused = false;
    }),
    getVoices: vi.fn((): SpeechSynthesisVoice[] => []),
  };
  return synth;
}

/** 可恢复地替换全局值；afterEach 会恢复原状（jsdom 中原本不存在）。 */
function installGlobal(name: string, value: unknown): PropertyDescriptor | undefined {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
  return original;
}

function restoreGlobal(name: string, original: PropertyDescriptor | undefined): void {
  if (original) {
    Object.defineProperty(globalThis, name, original);
  } else {
    delete (globalThis as Record<string, unknown>)[name];
  }
}

/** Web Audio 替身：AudioParam 记录全部调度（包络）调用，供 spy 断言。 */
class MockAudioParam {
  value: number;
  readonly schedule: Array<{ method: string; args: number[] }> = [];

  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  private record(method: string, ...args: number[]): this {
    this.schedule.push({ method, args });
    return this;
  }

  setValueAtTime(value: number, time: number): this {
    this.value = value;
    return this.record("setValueAtTime", value, time);
  }

  linearRampToValueAtTime(value: number, time: number): this {
    this.value = value;
    return this.record("linearRampToValueAtTime", value, time);
  }

  exponentialRampToValueAtTime(value: number, time: number): this {
    this.value = value;
    return this.record("exponentialRampToValueAtTime", value, time);
  }

  cancelScheduledValues(time: number): this {
    return this.record("cancelScheduledValues", time);
  }
}

/** connect 目标占位节点；生产代码不会调用其方法。 */
class MockDestinationNode {
  // 仅作为 gain.connect(ctx.destination) 的目标，无需任何方法。
}

/** Web Audio 替身：OscillatorNode，方法全部为可断言的 spy。 */
class MockOscillatorNode {
  readonly frequency = new MockAudioParam(0);
  type: OscillatorType = "sine";
  readonly connect: Mock<[MockAudioNode], MockOscillatorNode> = vi.fn(
    (_dest: MockAudioNode) => this,
  );
  readonly disconnect: Mock<[], void> = vi.fn(() => {});
  readonly start: Mock<[number], void> = vi.fn((_when: number) => {});
  readonly stop: Mock<[number], void> = vi.fn((_when: number) => {});
}

/** Web Audio 替身：GainNode，方法全部为可断言的 spy。 */
class MockGainNode {
  readonly gain = new MockAudioParam(1);
  readonly connect: Mock<[MockAudioNode], MockGainNode> = vi.fn(
    (_dest: MockAudioNode) => this,
  );
  readonly disconnect: Mock<[], void> = vi.fn(() => {});
}

type MockAudioNode = MockOscillatorNode | MockGainNode | MockDestinationNode;

/**
 * Web Audio 替身：AudioContext。
 *
 * createOscillator / createGain 每次调用都会把新节点记入 created* 数组，
 * 方便测试断言“每次反馈恰好新建一个节点”。resume 模拟真实行为：
 * 调用后 state 变为 "running"。
 */
class MockAudioContext {
  readonly currentTime = 0;
  state: AudioContextState;
  readonly destination = new MockDestinationNode();
  readonly createdOscillators: MockOscillatorNode[] = [];
  readonly createdGains: MockGainNode[] = [];
  readonly resume: Mock<[], Promise<void>>;
  readonly createOscillator: Mock<[], MockOscillatorNode>;
  readonly createGain: Mock<[], MockGainNode>;

  constructor(state: AudioContextState = "running") {
    this.state = state;
    this.resume = vi.fn(() => {
      this.state = "running";
      return Promise.resolve();
    });
    this.createOscillator = vi.fn(() => {
      const osc = new MockOscillatorNode();
      this.createdOscillators.push(osc);
      return osc;
    });
    this.createGain = vi.fn(() => {
      const gain = new MockGainNode();
      this.createdGains.push(gain);
      return gain;
    });
  }
}

let synth: MockSpeechSynthesis;
let speakHanzi: (hanzi: string) => void;
let unlockAudio: () => void;
let stopAudio: () => void;
let playFeedback: (type: FeedbackType) => void;
const globalBackups = new Map<string, PropertyDescriptor | undefined>();

/** Web Audio 相关全局替身：每次测试重建，保证顺序无关。 */
let audioCtxCtor: Mock<[], MockAudioContext>;
let createdContexts: MockAudioContext[];
let nextContextState: AudioContextState = "running";

function stubSpeechGlobals(): void {
  for (const name of ["speechSynthesis", "SpeechSynthesisUtterance"] as const) {
    globalBackups.set(name, installGlobal(name, name === "speechSynthesis" ? synth : MockSpeechSynthesisUtterance));
  }
}

/** 注入 Web Audio 全局；webkitAudioContext 显式置为 undefined 以保证确定性。 */
function stubWebAudioGlobals(): void {
  nextContextState = "running";
  createdContexts = [];
  audioCtxCtor = vi.fn(() => {
    const ctx = new MockAudioContext(nextContextState);
    createdContexts.push(ctx);
    return ctx;
  });
  globalBackups.set("AudioContext", installGlobal("AudioContext", audioCtxCtor));
  globalBackups.set("webkitAudioContext", installGlobal("webkitAudioContext", undefined));
}

function restoreGlobals(): void {
  for (const name of Array.from(globalBackups.keys())) {
    restoreGlobal(name, globalBackups.get(name));
  }
  globalBackups.clear();
}

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("../audio");
  unlockAudio = mod.unlockAudio;
  speakHanzi = mod.speakHanzi;
  stopAudio = mod.stopAudio;
  playFeedback = mod.playFeedback;

  synth = createSpeechSynthesisMock();
  stubSpeechGlobals();
  stubWebAudioGlobals();
});

afterEach(() => {
  restoreGlobals();
  vi.useRealTimers(); // 防止 fake timers 泄漏到后续用例
});

describe("API 缺失时的容错", () => {
  test("speechSynthesis 缺失时调用不抛错", () => {
    Object.defineProperty(globalThis, "speechSynthesis", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(() => {
      unlockAudio();
      speakHanzi("中");
      playFeedback("correct");
      stopAudio();
    }).not.toThrow();
  });

  test("SpeechSynthesisUtterance 缺失时调用不抛错", () => {
    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(() => {
      unlockAudio();
      speakHanzi("中");
      playFeedback("incorrect");
      stopAudio();
    }).not.toThrow();
  });

  test("AudioContext 与 webkitAudioContext 均缺失时 playFeedback 不抛错", () => {
    for (const name of ["AudioContext", "webkitAudioContext"] as const) {
      Object.defineProperty(globalThis, name, {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
    expect(() => {
      playFeedback("correct");
      playFeedback("incorrect");
      stopAudio();
    }).not.toThrow();
    expect(audioCtxCtor).not.toHaveBeenCalled(); // 缺失时不应尝试创建
  });

  test("speechSynthesis cancel/speak 抛错时调用不抛错", () => {
    synth.cancel.mockImplementation(() => {
      throw new Error("cancel boom");
    });
    synth.speak.mockImplementation(() => {
      throw new Error("speak boom");
    });
    unlockAudio();
    expect(() => speakHanzi("中")).not.toThrow(); // 空闲直接 speak，speak 抛错被吞
    synth.speaking = true; // 模拟正在朗读
    expect(() => speakHanzi("二")).not.toThrow(); // cancel 抛错被吞，不安排定时器
    expect(() => stopAudio()).not.toThrow(); // stopAudio 内 cancel 抛错同样被吞
  });
});

describe("speakHanzi 朗读行为", () => {
  test("空字符串不朗读", () => {
    speakHanzi(""); // 解锁前，空串不应进入待朗读队列
    unlockAudio(); // 解锁后也不应播放空串
    expect(synth.speak).not.toHaveBeenCalled();
    speakHanzi("好"); // 对照：非空汉字应正常朗读
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.speak.mock.calls[0][0].text).toBe("好，");
  });

  test("有效汉字使用较慢语速，并以中文逗号产生自然停顿", () => {
    unlockAudio();
    speakHanzi("中");
    expect(synth.speak).toHaveBeenCalledTimes(1);
    const utterance = synth.speak.mock.calls[0][0];
    expect(utterance).toBeInstanceOf(MockSpeechSynthesisUtterance);
    expect(utterance.text).toBe("中，");
    expect(utterance.lang).toBe("zh-CN");
    expect(utterance.rate).toBe(0.78);
  });

  test("空闲时直接朗读；正在朗读时先 cancel 再延迟到下一宏任务（Chromium 竞态）", () => {
    vi.useFakeTimers();
    unlockAudio();
    speakHanzi("一");
    expect(synth.cancel).not.toHaveBeenCalled(); // 空闲路径不 cancel、不延迟
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.speak.mock.calls[0][0].text).toBe("一，");

    speakHanzi("二"); // speaking 为真：先 cancel，延迟到下一宏任务
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(synth.speak).toHaveBeenCalledTimes(1); // 尚未同步 speak
    vi.advanceTimersByTime(0); // 触发下一宏任务
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(synth.speak.mock.calls[1][0].text).toBe("二，");
    // cancel 发生在延迟后的 speak 之前
    expect(synth.cancel.mock.invocationCallOrder[0]).toBeLessThan(
      synth.speak.mock.invocationCallOrder[1],
    );
    vi.useRealTimers();
  });

  test("快速连续调用只播最新一条，旧的延迟朗读被替换", () => {
    vi.useFakeTimers();
    unlockAudio();
    speakHanzi("一"); // 直接播放
    speakHanzi("二"); // 排队（延迟）
    speakHanzi("三"); // 替换“二”
    expect(synth.speak).toHaveBeenCalledTimes(1); // 只有“一”已播放
    expect(synth.cancel).toHaveBeenCalledTimes(2); // “二”“三”各 cancel 一次
    vi.advanceTimersByTime(0);
    expect(synth.speak).toHaveBeenCalledTimes(2); // 只补播最新“三”
    expect(synth.speak.mock.calls[1][0].text).toBe("三，");
    vi.useRealTimers();
  });

  test("空闲直接播放时清理仍挂起的旧延迟朗读，防止过期文本补播", () => {
    vi.useFakeTimers();
    unlockAudio();
    speakHanzi("一"); // 直接播放
    speakHanzi("二"); // 排队（延迟）
    synth.speaking = false; // 模拟真实 Chromium 中 cancel 已异步生效
    speakHanzi("三"); // 此时空闲 → 直接播放，并取消旧延迟朗读
    expect(synth.speak).toHaveBeenCalledTimes(2); // “一”“三”
    expect(synth.speak.mock.calls[1][0].text).toBe("三，");
    vi.advanceTimersByTime(0);
    expect(synth.speak).toHaveBeenCalledTimes(2); // 旧的“二”不再补播
    vi.useRealTimers();
  });

  test("stopAudio 清理待播的延迟朗读，之后不再补播", () => {
    vi.useFakeTimers();
    unlockAudio();
    speakHanzi("一"); // 直接播放
    speakHanzi("二"); // 排队（延迟）
    stopAudio(); // 应清理延迟定时器
    vi.advanceTimersByTime(0);
    expect(synth.speak).toHaveBeenCalledTimes(1); // 只有“一”
    expect(synth.speak.mock.calls[0][0].text).toBe("一，");
    vi.useRealTimers();
  });

  test("正确提示音结束后短暂停顿，再朗读新字", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    unlockAudio();
    playFeedback("correct"); // 220ms 提示音 + 120ms 停顿
    speakHanzi("新");

    expect(synth.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(339);
    expect(synth.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.speak.mock.calls[0][0].text).toBe("新，");
    vi.useRealTimers();
  });
});

describe("unlockAudio 待朗读队列", () => {
  test("unlockAudio 之前只保留最新待朗读汉字，unlockAudio 后只播放最新一个", () => {
    speakHanzi("甲");
    speakHanzi("乙");
    expect(synth.speak).not.toHaveBeenCalled(); // 解锁前不朗读，只保留最新
    unlockAudio();
    expect(synth.speak).toHaveBeenCalledTimes(1); // 只播放最新一个
    expect(synth.speak.mock.calls[0][0].text).toBe("乙，");
  });
});

describe("unlockAudio 在手势阶段解锁 Web Audio", () => {
  test("创建 AudioContext 并对 suspended 上下文调用 resume", () => {
    nextContextState = "suspended";
    expect(audioCtxCtor).not.toHaveBeenCalled(); // 调用前不创建
    unlockAudio();
    expect(audioCtxCtor).toHaveBeenCalledTimes(1); // 手势内惰性创建
    const ctx = createdContexts[0];
    expect(ctx.resume).toHaveBeenCalledTimes(1); // suspended 时 resume
    expect(ctx.state).toBe("running");
  });

  test("上下文已 running 时只创建不重复 resume", () => {
    unlockAudio();
    expect(audioCtxCtor).toHaveBeenCalledTimes(1);
    const ctx = createdContexts[0];
    expect(ctx.state).toBe("running");
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  test("Web Audio 不可用时 unlockAudio 不抛错", () => {
    for (const name of ["AudioContext", "webkitAudioContext"] as const) {
      Object.defineProperty(globalThis, name, {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
    expect(() => unlockAudio()).not.toThrow();
  });
});

describe("stopAudio", () => {
  test("stopAudio 清除待朗读内容", () => {
    speakHanzi("中"); // 解锁前进入待朗读队列
    stopAudio();
    unlockAudio(); // 若待朗读未被清除，这里会播放“中”
    expect(synth.speak).not.toHaveBeenCalled();
  });

  test("stopAudio 取消进行中的朗读", () => {
    unlockAudio();
    speakHanzi("中");
    expect(synth.speak).toHaveBeenCalledTimes(1);
    stopAudio();
    expect(synth.cancel).toHaveBeenCalled();
    const speakOrder = synth.speak.mock.invocationCallOrder;
    const cancelOrder = synth.cancel.mock.invocationCallOrder;
    expect(cancelOrder[cancelOrder.length - 1]).toBeGreaterThan(speakOrder[0]);
  });
});

describe("playFeedback 反馈音（Web Audio）", () => {
  test("第一次 playFeedback 惰性创建 AudioContext，后续复用同一实例", () => {
    expect(audioCtxCtor).not.toHaveBeenCalled(); // 调用前不创建
    playFeedback("correct");
    playFeedback("incorrect");
    expect(audioCtxCtor).toHaveBeenCalledTimes(1); // 首次惰性创建
    expect(createdContexts).toHaveLength(1); // 后续反馈复用同一个实例
  });

  test("context.state 为 suspended 时先 resume 再播放，running 后不重复 resume", () => {
    nextContextState = "suspended";
    playFeedback("correct");
    expect(createdContexts).toHaveLength(1);
    const ctx = createdContexts[0];
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    expect(ctx.state).toBe("running"); // resume 后应为 running
    // 同一 context 已 running，后续反馈不应再次 resume
    playFeedback("incorrect");
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  test("correct 与 incorrect 使用可观察到的不同频率与包络参数", () => {
    // correct 使用较高频率和较短包络，incorrect 使用较低频率和较长包络。
    playFeedback("correct");
    playFeedback("incorrect");
    expect(createdContexts).toHaveLength(1);
    const ctx = createdContexts[0];
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    expect(ctx.createGain).toHaveBeenCalledTimes(2);
    const [correctOsc, incorrectOsc] = ctx.createdOscillators;
    const [correctGain, incorrectGain] = ctx.createdGains;
    // 频率：正/误反馈音高不同且为正
    expect(correctOsc.frequency.value).toBeGreaterThan(0);
    expect(incorrectOsc.frequency.value).toBeGreaterThan(0);
    expect(correctOsc.frequency.value).not.toBe(incorrectOsc.frequency.value);
    // 包络：各有峰值与衰减调度，且两种反馈的调度序列可观察地不同
    expect(correctGain.gain.schedule.length).toBeGreaterThanOrEqual(2);
    expect(incorrectGain.gain.schedule.length).toBeGreaterThanOrEqual(2);
    expect(correctGain.gain.schedule).not.toEqual(incorrectGain.gain.schedule);
    // 音量峰值与衰减时长保持在调优后的水平。
    expect(correctGain.gain.schedule[1].args[0]).toBe(0.45);
    expect(correctGain.gain.schedule.at(-1)?.args).toEqual([0.0001, 0.22]);
    expect(incorrectGain.gain.schedule[1].args[0]).toBe(0.6);
    expect(incorrectGain.gain.schedule.at(-1)?.args).toEqual([0.0001, 0.45]);
  });

  test("单次 playFeedback 只创建并启动一个 oscillator，并安排自然停止", () => {
    playFeedback("correct");
    expect(createdContexts).toHaveLength(1);
    const ctx = createdContexts[0];
    const osc = ctx.createdOscillators[0];
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
    expect(ctx.createGain).toHaveBeenCalledTimes(1);
    expect(osc.start).toHaveBeenCalledTimes(1);
    expect(osc.stop).toHaveBeenCalledTimes(1); // 已安排自然停止
  });

  test("osc → gain → destination 连接链，且 connect 先于 start", () => {
    playFeedback("correct");
    const ctx = createdContexts[0];
    const osc = ctx.createdOscillators[0];
    const gain = ctx.createdGains[0];
    expect(osc.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(ctx.destination);
    // 连接必须发生在 start 之前（真实 Web Audio 中先 start 再 connect 会丢失音频）
    expect(osc.connect.mock.invocationCallOrder[0]).toBeLessThan(
      osc.start.mock.invocationCallOrder[0],
    );
    expect(gain.connect.mock.invocationCallOrder[0]).toBeLessThan(
      osc.start.mock.invocationCallOrder[0],
    );
  });

  test("oscillator 在衰减结束后安排自然停止，避免无限运行", () => {
    playFeedback("correct");
    playFeedback("incorrect");
    const ctx = createdContexts[0];
    for (const osc of ctx.createdOscillators) {
      // 每次创建时都安排自然停止；osc.stop 的第一次调用即创建时的自然停止
      // （旧节点随后可能再被新反馈显式 stop，故这里只检查首个 stop 调用）
      expect(osc.stop).toHaveBeenCalled();
      const [stopTime] = osc.stop.mock.calls[0];
      const [startTime] = osc.start.mock.calls[0];
      expect(typeof stopTime).toBe("number");
      // 自然停止时间应在启动之后（覆盖完整衰减段），不是 0 秒的立即停止
      expect(stopTime).toBeGreaterThan(startTime);
      expect(stopTime).toBeGreaterThan(0);
    }
  });

  test("节点 stop 抛错（如已按自然时间停止）时仍安全断开且新反馈照常播放", () => {
    playFeedback("correct");
    const ctx = createdContexts[0];
    const firstOsc = ctx.createdOscillators[0];
    firstOsc.stop.mockImplementation(() => {
      throw new Error("already stopped");
    });
    expect(() => playFeedback("incorrect")).not.toThrow();
    expect(firstOsc.disconnect).toHaveBeenCalledTimes(1); // 即使 stop 抛错仍断开
    const secondOsc = ctx.createdOscillators[1];
    expect(secondOsc.start).toHaveBeenCalledTimes(1); // 新反馈正常启动
  });

  test("快速连续反馈会停止并断开前一个反馈，不形成长队列", () => {
    playFeedback("correct");
    playFeedback("incorrect");
    playFeedback("correct");
    expect(createdContexts).toHaveLength(1);
    const ctx = createdContexts[0];
    // 每次反馈恰好新建一个 oscillator（共 3 个，没有累积排队）
    expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
    const [first, second, third] = ctx.createdOscillators;
    expect(first.start).toHaveBeenCalledTimes(1);
    expect(second.start).toHaveBeenCalledTimes(1);
    expect(third.start).toHaveBeenCalledTimes(1);
    // 前两个反馈除创建时的自然停止外，还被新反馈显式停止并断开；
    // 最新一个仅被自然停止，未被新反馈停止
    expect(first.stop).toHaveBeenCalledTimes(2);
    expect(second.stop).toHaveBeenCalledTimes(2);
    expect(first.disconnect).toHaveBeenCalledTimes(1);
    expect(second.disconnect).toHaveBeenCalledTimes(1);
    expect(third.stop).toHaveBeenCalledTimes(1); // 仅自然停止
    expect(third.disconnect).not.toHaveBeenCalled();
    // 停止旧反馈发生在启动新反馈之前
    expect(second.disconnect.mock.invocationCallOrder[0]).toBeLessThan(
      third.start.mock.invocationCallOrder[0],
    );
  });

  test("stopAudio 停止当前反馈节点", () => {
    playFeedback("correct");
    expect(createdContexts).toHaveLength(1);
    const ctx = createdContexts[0];
    const osc = ctx.createdOscillators[0];
    stopAudio();
    // stop 共 2 次：创建时的自然停止 + stopAudio 的显式停止
    expect(osc.stop).toHaveBeenCalledTimes(2);
    expect(osc.disconnect).toHaveBeenCalledTimes(1);
    // 未播放反馈时 stopAudio 也不抛错
    expect(() => stopAudio()).not.toThrow();
  });

  test("AudioContext 构造抛错时 unlockAudio/playFeedback 不抛错", () => {
    audioCtxCtor.mockImplementation(() => {
      throw new Error("ctx unavailable");
    });
    expect(() => {
      unlockAudio();
      playFeedback("correct");
      playFeedback("incorrect");
      stopAudio();
    }).not.toThrow();
  });

  test("resume 抛错或 Promise 拒绝时 playFeedback 不抛错且仍继续播放", () => {
    nextContextState = "suspended";
    audioCtxCtor.mockImplementation(() => {
      const ctx = new MockAudioContext("suspended");
      ctx.resume.mockImplementation(() => {
        throw new Error("resume sync boom");
      });
      createdContexts.push(ctx);
      return ctx;
    });
    expect(() => playFeedback("correct")).not.toThrow();
    const ctx = createdContexts[0];
    expect(ctx.createdOscillators[0].start).toHaveBeenCalledTimes(1); // 仍继续播放
    expect(ctx.state).toBe("suspended");
    // Promise 拒绝路径同样被静默吞掉
    ctx.resume.mockRejectedValue(new Error("resume async boom"));
    expect(() => playFeedback("incorrect")).not.toThrow();
    expect(ctx.createdOscillators[1].start).toHaveBeenCalledTimes(1);
  });

  test("仅 webkitAudioContext 可用时回退使用", () => {
    Object.defineProperty(globalThis, "AudioContext", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const webkitCtor = vi.fn(() => {
      const ctx = new MockAudioContext("running");
      createdContexts.push(ctx);
      return ctx;
    });
    const originalWebkit = installGlobal("webkitAudioContext", webkitCtor);
    globalBackups.set("webkitAudioContext", originalWebkit);

    playFeedback("correct");
    expect(webkitCtor).toHaveBeenCalledTimes(1); // 回退到 webkitAudioContext
    expect(audioCtxCtor).not.toHaveBeenCalled();
    expect(createdContexts).toHaveLength(1);
    expect(createdContexts[0].createdOscillators[0].start).toHaveBeenCalledTimes(1);
  });

  test("AudioContext 与 webkitAudioContext 同时存在时优先 AudioContext", () => {
    const webkitCtor = vi.fn(() => {
      throw new Error("webkitAudioContext should not be used");
    });
    const originalWebkit = installGlobal("webkitAudioContext", webkitCtor);
    globalBackups.set("webkitAudioContext", originalWebkit);

    playFeedback("correct");
    expect(audioCtxCtor).toHaveBeenCalledTimes(1);
    expect(webkitCtor).not.toHaveBeenCalled();
  });
});
