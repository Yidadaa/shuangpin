export class TypingSummary {
  constructor() {}

  onKeyPressed() {
    this.pressCount += 1;

    this.accumTime();
  }

  onValid(result: boolean) {
    this.totalValid += 1;
    this.totalCorrect += Number(result);
  }

  /**
   * 击键间隔大于 5s，不收集时间
   */
  private accumTime() {
    const time = performance.now();
    const diff = time - this.lastTime;

    if (diff < 5000) {
      this.totalTime += diff;
    }
    this.lastTime = time;
  }

  get hanziPerMinutes() {
    if (this.totalTime === 0) return 0;
    return (this.totalCorrect / this.totalTime) * 1000 * 60;
  }

  get pressPerHanzi() {
    if (this.totalCorrect === 0) return 0;
    return this.pressCount / this.totalCorrect;
  }

  get accuracy() {
    if (this.totalValid === 0) return 0;
    return this.totalCorrect / this.totalValid;
  }

  private lastTime = 0;
  private pressCount = 0;
  private totalTime = 0;
  private totalValid = 0;
  private totalCorrect = 0;
}
