/**
 * 音频服务（CP-04：汉字朗读 + CP-06：正/误反馈音）。
 *
 * 对外公开固定 API：unlockAudio / speakHanzi / stopAudio / playFeedback。
 * 模块加载阶段不访问 window、speechSynthesis、SpeechSynthesisUtterance
 * 或 AudioContext，浏览器 API 只在调用时惰性读取并在缺失/异常时静默降级，
 * 绝不打断输入流程。不依赖 Vue / Pinia 或其他项目状态。
 */

export type FeedbackType = "correct" | "incorrect";

/** 是否已通过用户手势解锁音频。 */
let audioUnlocked = false;

/** 解锁前待朗读的最新非空文本（null 表示无待朗读内容）。 */
let pendingHanzi: string | null = null;

/**
 * 因 Chromium cancel 竞态而推迟到下一宏任务执行的朗读定时器；
 * null 表示无挂起的延迟朗读。快速连续调用会取消上一个定时器，只播最新。
 */
let deferredSpeakTimer: ReturnType<typeof setTimeout> | null = null;

/** 单字朗读语速；略慢于系统默认值，以提高辨识度。 */
const SPEECH_RATE = 0.78;

/** 提示音结束后到汉字朗读之间的短暂停顿。 */
const POST_FEEDBACK_SPEECH_PAUSE_MS = 120;

/** 下一次汉字朗读允许开始的最早时间。 */
let speechNotBefore = 0;

/**
 * 真正执行 speak。直接路径与延迟回调共用；getVoices / speak 的任何
 * 异常均在此静默吞掉，保证不影响输入流程。
 */
function doSpeak(
  synth: SpeechSynthesis,
  UtteranceCtor: typeof SpeechSynthesisUtterance,
  text: string,
): void {
  try {
    // 末尾逗号让语音引擎为孤立汉字增加自然停顿，避免连续朗读黏在一起。
    const utterance = new UtteranceCtor(`${text}，`);
    utterance.lang = "zh-CN";
    utterance.rate = SPEECH_RATE;

    // 可选：优先选用可用的中文 voice（不做任何 voiceschanged 全局监听，
    // 第一版仅依赖 utterance.lang 即可）。
    try {
      const zhVoice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("zh"));
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
    } catch {
      // getVoices 不可用或抛错时忽略，仍按 lang 播放。
    }

    synth.speak(utterance);
  } catch {
    // 任何异常均静默忽略，保证不影响输入流程。
  }
}

/**
 * 用语音合成朗读指定文本。
 *
 * Chromium 的 cancel() 异步生效：在 speaking/pending 为真时先 cancel
 * 再同步 speak，新 utterance 会被静默丢弃。因此这里在 speaking/pending
 * 时先 cancel，并把最新朗读推迟到下一宏任务再 speak；快速连续调用会
 * 取消上一个定时器，保证只播放最新一条。若空闲则直接 speak（并清理
 * 可能仍挂起的旧延迟朗读，防止过期文本在最新朗读之后补播）。
 */
function speakText(text: string): void {
  try {
    const synth = globalThis.speechSynthesis;
    const UtteranceCtor = globalThis.SpeechSynthesisUtterance;
    if (typeof synth === "undefined" || synth == null || typeof UtteranceCtor !== "function") {
      return;
    }

    const isBusy = synth.speaking || synth.pending;
    const delay = Math.max(0, speechNotBefore - Date.now());

    if (deferredSpeakTimer !== null) {
      clearTimeout(deferredSpeakTimer);
      deferredSpeakTimer = null;
    }

    if (isBusy) {
      synth.cancel();
    }

    // 正在朗读时避开 Chromium cancel/speak 竞态；刚播放正确提示音时，
    // 等提示音结束并短暂停顿后再读新字。快速连续调用只保留最新文本。
    if (isBusy || delay > 0) {
      deferredSpeakTimer = setTimeout(() => {
        deferredSpeakTimer = null;
        doSpeak(synth, UtteranceCtor, text);
      }, delay);
      return;
    }

    doSpeak(synth, UtteranceCtor, text);
  } catch {
    // cancel 等异常均静默忽略，保证不影响输入流程。
  }
}

/** 解锁音频（需由用户手势触发）。解锁后立即播放解锁前缓存的待朗读文本。 */
export function unlockAudio(): void {
  audioUnlocked = true;

  // iOS/WebKit：Web Audio 上下文必须在用户手势内创建并 resume 才能解锁，
  // 否则首次 playFeedback（在 keypress 中惰性创建）会因脱离手势而无法发声。
  // 这里在手势阶段惰性创建并恢复，后续 playFeedback 直接复用已解锁的上下文。
  const ctx = getFeedbackContext();
  if (ctx !== null) {
    resumeContext(ctx);
  }

  const text = pendingHanzi;
  if (text !== null) {
    pendingHanzi = null;
    speakText(text);
  }
}

/** 朗读指定汉字。解锁前只缓存最新非空文本，解锁后直接朗读。 */
export function speakHanzi(hanzi: string): void {
  if (hanzi === "") {
    return; // 空文本不进入待朗读队列，也不朗读
  }
  if (!audioUnlocked) {
    pendingHanzi = hanzi; // 只保留最新一个
    return;
  }
  speakText(hanzi);
}

/**
 * 反馈音配置：correct 为 880Hz 高音/短衰减，incorrect 为 330Hz 低音/长衰减。
 */
const FEEDBACK_TONES: Record<FeedbackType, { frequency: number; duration: number; peak: number }> = {
  correct: { frequency: 880, duration: 0.22, peak: 0.45 },
  incorrect: { frequency: 330, duration: 0.45, peak: 0.6 },
};

/** Web Audio 上下文（惰性创建并复用；null 表示不可用）。 */
let feedbackCtx: AudioContext | null = null;

/** 当前反馈音的活动节点（新反馈/stopAudio 时停止并清理，避免排队与泄漏）。 */
let activeOsc: OscillatorNode | null = null;
let activeGain: GainNode | null = null;

/**
 * 获取（必要时惰性创建）并返回 Web Audio 上下文。
 * 支持 AudioContext 或 webkitAudioContext；两者均缺失或创建抛错时返回 null。
 */
function getFeedbackContext(): AudioContext | null {
  try {
    if (feedbackCtx === null) {
      const w = globalThis as unknown as {
        AudioContext?: new () => AudioContext;
        webkitAudioContext?: new () => AudioContext;
      };
      const Ctor = w.AudioContext ?? w.webkitAudioContext;
      if (typeof Ctor !== "function") {
        return null;
      }
      feedbackCtx = new Ctor();
    }
    return feedbackCtx;
  } catch {
    return null;
  }
}

/**
 * 恢复 suspended 的 Web Audio 上下文（须在用户手势内调用才可能生效）。
 * resume 抛错或返回的 Promise 拒绝均静默忽略，不中断调用方。
 */
function resumeContext(ctx: AudioContext): void {
  if (ctx.state !== "suspended") {
    return;
  }
  try {
    const p = ctx.resume();
    if (p !== undefined && p !== null && typeof (p as Promise<void>).catch === "function") {
      (p as Promise<void>).catch(() => {});
    }
  } catch {
    // resume 异常静默忽略，仍继续尝试播放。
  }
}

/**
 * 停止并断开当前反馈节点（如有）。
 * 已按自然停止时间停过的节点再次 stop() 会抛 InvalidStateError，
 * 这里对 stop / disconnect 分别容错，保证新反馈与 stopAudio 总能安全清理。
 */
function stopFeedbackNodes(): void {
  if (activeOsc !== null) {
    try {
      activeOsc.stop();
    } catch {
      // 已自然停止的节点再次 stop 抛错，忽略后仍继续断开。
    }
    try {
      activeOsc.disconnect();
    } catch {
      // 断开异常静默忽略。
    }
    activeOsc = null;
  }
  if (activeGain !== null) {
    try {
      activeGain.disconnect();
    } catch {
      // 断开异常静默忽略。
    }
    activeGain = null;
  }
}

/**
 * 播放正确/错误反馈音（Web Audio）。
 * 惰性创建并复用 AudioContext；suspended 时先 resume（异常与 Promise 拒绝静默）；
 * 新反馈开始前停止/断开旧节点；衰减结束后安排自然停止，避免振荡器无限运行；
 * API 缺失或任何调用异常均安全 no-op。
 */
export function playFeedback(type: FeedbackType): void {
  try {
    const ctx = getFeedbackContext();
    if (ctx === null) {
      return; // 不支持 Web Audio 时安全 no-op
    }

    // suspended 时先恢复上下文（unlockAudio 已尽力在手势内恢复，这里兜底）。
    resumeContext(ctx);

    // 新反馈开始前停止/断开旧反馈节点，避免排队与节点泄漏。
    stopFeedbackNodes();

    const tone = FEEDBACK_TONES[type];
    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(tone.frequency, startTime);

    // 增益包络：从静音快速爬升到峰值后指数衰减至接近零，避免爆音。
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(tone.peak, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + tone.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);

    // 衰减到接近静音后安排自然停止，避免振荡器无限运行；
    // 新反馈/stopAudio 的显式 stop 仍安全（重复 stop 抛错由 stopFeedbackNodes 兜底）。
    osc.stop(startTime + tone.duration + 0.05);

    // 新目标字会在提示音之后出现；确保提示音完整结束，再留出短暂停顿。
    speechNotBefore =
      Date.now() + tone.duration * 1000 + POST_FEEDBACK_SPEECH_PAUSE_MS;

    activeOsc = osc;
    activeGain = gain;
  } catch {
    // 任何异常静默忽略，保证不影响输入流程。
  }
}

/**
 * 停止所有音频：清除待朗读内容与延迟朗读定时器、取消进行中的朗读并停止当前反馈节点。
 */
export function stopAudio(): void {
  pendingHanzi = null;
  speechNotBefore = 0;
  if (deferredSpeakTimer !== null) {
    clearTimeout(deferredSpeakTimer);
    deferredSpeakTimer = null;
  }
  stopFeedbackNodes();
  try {
    globalThis.speechSynthesis?.cancel();
  } catch {
    // API 缺失或异常时静默忽略。
  }
}
